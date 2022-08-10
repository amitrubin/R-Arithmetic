// Support for fractions
// Programmer: Mayer Goldberg, 2021
//      ...with additions and corrections by Amit Rubin, 2022
let pc = require('./pc.js');
BigInt.factorial = (n) => (n === 0n) ? 1n :  n * BigInt.factorial(n-1n);

BigInt.gcd = (a, b) => {
    while (b !== 0n) [a, b] = [b, a % b];

    return a;
}
Math.gcd = (a, b) => {
    while (b !== 0) [a, b] = [b, a % b];

    return a;
}
BigInt.abs = function(bigint_num){
    if(bigint_num < 0n) return - bigint_num;
    else return bigint_num;
}

BigInt.toFloatString = function(bigint_num, precision) {
    let a = bigint_num;
    if(a < 0n) a = - bigint_num;
    let s = a.toString();
    if(precision === undefined)precision = 5;

    if(s.length <precision) return s;
    else{
        ;
        return `${bigint_num/(10n**BigInt(s.length-precision))}e${s.length-precision}`;
    }
}

let nt_nat =
    pc.Grammar
        .start()
        .push(pc.range('0', '9'))
        .pack((ch) => ch.charCodeAt(0) - '0'.charCodeAt(0))
        .plus()
        .pack((arr) => pc.fold_left((a, b) => 10n * a + BigInt(b), 0n, arr))
        .done();

let nt_int =
    pc.Grammar
        .start()
        .push(pc.character('+'))
        .pack((_) => true)
        .push(pc.character('-'))
        .pack((_) => false)
        .disj()
        .maybe()
        .pack((arr) => (arr[0]) ? arr[1] : true)

        .push(nt_nat)
        .caten()
        .pack((arr) => (arr[0]) ? arr[1] : -arr[1])
        .done();

let nt_number =
    pc.Grammar
        .start()
        .push(nt_int)
        .push(pc.character('/'))
        .push(nt_nat)
        .caten()
        .pack((arr) => arr[1])
        .maybe()
        .pack((arr) => (arr[0]) ? arr[1] : 1n)
        .caten()
        .pack((arr) => Fraction.make_fraction_from_bignums(arr[0], arr[1]))
        .done();

let nt_spaced_number =
    pc.Grammar
        .start()
        .const((ch) => ch <= ' ')
        .star()
        .dup()
        .push(nt_number)
        .swap()
        .caten()
        .pack((arr) => arr[0])
        .caten()
        .pack((arr) => arr[1])
        .push(pc.nt_end_of_input)
        .caten()
        .pack((arr) => arr[0])
        .done();

class Fraction {
    // DO NOT call the constructor directly! Use the factory-methods!
    constructor(num, den) {
        if (den < 0n) {
            this.num = - num;
            this.den = - den;
        }
        else {
            this.num = num;
            this.den = den;
        }
    }

    static make_fraction_from_bignums(num, den) {
        let num_ = BigInt(num);
        let den_ = BigInt(den);
        let d = BigInt.gcd(num_, den_);
        return new Fraction(num_ / d, den_ / d);
    }

    static make_fraction_from_string(str) {
        return nt_spaced_number.match(str, 0).value;
    }
    clone(){
        return new Fraction(this.num,this.den);
    }

    toString() {
        return `new Fraction(${this.num}, ${this.den})`;
    }

    to_text_string() {
        if (this.den === 0n) throw `ZeroDenominator`;
        if (this.num === 0n) return `0`;
        if (this.den === 1n) return `${this.num}`;
        if (this.den === -1n) return `${-this.num}`;
        return `${this.num}/${this.den}`;
    }

    to_text_string2() {
        if (this.den === 0n) throw `ZeroDenominator`;
        if (this.num === 0n) return `0`;
        if (this.den === 1n) return `${BigInt.toFloatString(this.num)}`;
        if (this.den === -1n) return `${BigInt.toFloatString(-this.num)}`;
        return `${BigInt.toFloatString(this.num)}/${BigInt.toFloatString(this.den)}`;
        
    }

    to_decimal_string(n) {
        if(this.num * this.den < 0n) return "-"+this.negate().to_decimal_string(n);
        n = BigInt(n);
        let result = `${this.trunc_to_BigInt()}.`;
        let frac = this.mantissa();
        for (let i = 0n, a = frac.num * 10n, b = frac.den; i < n; ++i) {
            let d = a / b;
            result += `${d}`;
            a = (a - d * b) * 10n;
        }
        return result;
    }

    abs() {
        return (this.is_positive()) ? this : this.negate();
    }

    is_positive() {
        return (this.num > 0n);
    }
    negate() {
        return new Fraction(-this.num, this.den);
    }

    inverse() {
        return new Fraction(this.den, this.num);
    }

    add(frac) {
        return new Fraction(this.num * frac.den + this.den * frac.num, this.den * frac.den);
    }

    sub(frac) {
        return new Fraction(this.num * frac.den - this.den * frac.num, this.den * frac.den);
    }

    mul(frac) {
        return new Fraction(this.num * frac.num, this.den * frac.den);
    }


    div(frac) {
        return new Fraction(this.num * frac.den, this.den * frac.num);
    }

    power(n) {
        let nn = BigInt(n);
        if(nn >= 0) return new Fraction(this.num ** nn, this.den ** nn);
        else return new Fraction(this.den ** -nn, this.num ** -nn);
    }

    trunc() {
        return new Fraction(this.num / this.den, 1n);
    }

    trunc_to_BigInt() {
        return this.trunc().num;
    }

    mantissa() {
        return this.sub(this.trunc());
    }

    compare(frac) {
        return this.num * frac.den - this.den * frac.num;
    }

    is_gt(frac) {
        return this.compare(frac) > 0n;
    }

    is_lt(frac) {
        return this.compare(frac) < 0n;
    }

    is_ge(frac) {
        return this.compare(frac) >= 0n;
    }

    is_le(frac) {
        return this.compare(frac) <= 0n;
    }

    is_eq(frac) {
        return this.compare(frac) === 0n;
    }

    is_ne(frac) {
        return this.compare(frac) !== 0n;
    }

    is_zero() {
        return this.num === 0n;
    }

    is_non_zero() {
        return this.num !== 0n;
    }

    to_continued_fraction_list() {
        let result = new Array();
        let frac = this;
        if (frac.is_zero()) {
            throw `Division by zero`;
        } else {
            frac = frac.inverse();
            while (frac.is_non_zero()) {
                frac = frac.inverse();
                result.push(frac.trunc_to_BigInt());
                frac = frac.mantissa();
            }
        }
        return result;
    }

    is_integer() {
        return  (this.num / this.den) * this.den === this.num;
    }

    simplify() {
        let d = BigInt.gcd(this.num, this.den);
        if(d < 0n)d = -d;
        this.num = this.num/d;
        this.den = this.den/d;
    }

    dist(frac){
        return this.sub(frac).abs();
    }

    static distance(num1,den1,num2,den2){
        return Fraction.make_fraction_from_bignums(num1,den1).dist(Fraction.make_fraction_from_bignums(num2,den2));
    }

    static average(frac_lst){ //frac_lst non-empty array
        let sum_of_fractions = frac_lst.reduce((prev,curr) => prev.add(curr));
        let to_divide_by = new Fraction(BigInt(frac_lst.length), 1n);
        return sum_of_fractions.div(to_divide_by);
    }

    static min(frac_lst){
        return frac_lst.reduce((prev,curr) => prev.is_lt(curr) ? prev : curr);
    }

    static max(frac_lst){
        return frac_lst.reduce((prev,curr) => prev.is_gt(curr) ? prev : curr);
    }

    static continued_fraction_list_to_partial_fractions_list(cf_list) {
        let a = 0n, b = 1n, c = 1n, d = 0n;
        let result = new Array();
        for (let k in cf_list) {
            [a, b] = [b, BigInt(cf_list[k]) * b + a];
            [c, d] = [d, BigInt(cf_list[k]) * d + c];
            result.push(new Fraction(b, d));
        }
        return result;
    }

    static continued_fraction_list_to_fraction(cf_list) {
        let a = 0n, b = 1n, c = 1n, d = 0n;
        for (let k in cf_list) {
            [a, b] = [b, BigInt(cf_list[k]) * b + a];
            [c, d] = [d, BigInt(cf_list[k]) * d + c];
        }
        let out = new Fraction(b, d);
        out.simplify();
        return out;
    }
    static rationals_continued_fraction_list_to_fraction(rational_cf_list) {
        let a = zero(), b = one(), c = one(), d = zero();
        for (let k in rational_cf_list) {
            [a, b] = [b, (rational_cf_list[k]).mul(b).add(a)];
            [c, d] = [d, (rational_cf_list[k]).mul(d).add(c)];
        }
        let out = b.div(d);
        out.simplify();
        return out;
    }

    static float_to_continued_fraction_list(x, n) {
        let result = new Array();
        for (let i = 0; i < n; ++i) {
            let ip = Math.trunc(x);
            result.push(BigInt(ip));
            x = 1 / (x - ip);
        }
        return result;
    }
}




module.exports = {
    Fraction
}

// let f1 = Fraction.make_fraction_from_string('   -355/113   ');
// let f2 = Fraction.make_fraction_from_string('42');
// console.log(`${f1.to_text_string()}`);
// console.log(`${f2.to_text_string()}`);


// let a69 = Fraction.make_fraction_from_bignums(100n,3n);
// let b69 = a69.to_continued_fraction_list();
// console.log(b69);
// let c69 = Fraction.continued_fraction_list_to_fraction([0,1,1,1,2,2,4,2,1,3]); //0.631
// console.log(c69);
let fr = require('./fractions.js'); // note - fractions.js adds methods to class BigInt which are utilized here.
let make_fraction = fr.Fraction.make_fraction_from_bignums;

//-----------------------<remove leading zeroes>-----------------------
Array.remove_zero_pairs = function (arr) {
	if(arr.length === 0) return arr;
	else if(arr[0].constructor.name === 'BigInt') return bignum_remove_zero_pairs(arr);
	else if(arr[0].constructor.name === 'Fraction') return fraction_remove_zero_pairs(arr);
}
let remove_leading_zero_pairs = function (bignum_arr) {
	if ((bignum_arr.length > 2) && bignum_arr[0] === 0n && bignum_arr[1] === 0n) {
		return remove_leading_zero_pairs(bignum_arr.slice(2));
	}
	else return bignum_arr;
}
function bignum_remove_zero_pairs(bignum_arr){
	let x = remove_leading_zero_pairs(bignum_arr);
	if(x.length > 2){
		return [x[0]].concat(bignum_remove_zero_pairs(x.slice(1)));
	}
	else{
		return x;
	}
}
let fraction_remove_leading_zero_pairs = function (fractions_arr) {
	if ((fractions_arr.length > 2) && fractions_arr[0].is_zero() && fractions_arr[1].is_zero()) {
		return fraction_remove_leading_zero_pairs(fractions_arr.slice(2));
	}
	else return fractions_arr;
}
function fraction_remove_zero_pairs(fractions_arr){
	let x = fraction_remove_leading_zero_pairs(fractions_arr);
	if(x.length > 2){
		return [x[0]].concat(fraction_remove_zero_pairs(x.slice(1)));
	}
	else{
		return x;
	}
}
//-----------------------</remove leading zeroes>-----------------------

function mat_mul(mat1,mat2){
	let x = [mat1[0].mul(mat2[0]).add(mat1[1].mul(mat2[2])),
             mat1[0].mul(mat2[1]).add(mat1[1].mul(mat2[3])),
             mat1[2].mul(mat2[0]).add(mat1[3].mul(mat2[2])),
             mat1[2].mul(mat2[1]).add(mat1[3].mul(mat2[3]))];
    x.map((x)=>x.simplify());
    return x;
}

function fraction_simplifier(frac, p){
	p = BigInt(p);
	p = 10n**p;
	let pp = p*p;
	let f = frac.clone();
	let bool_flip = false;
	if(!f.is_positive()){
		f = f.negate();
		bool_flip = true;
	}
	while(f.num > pp && f.den > pp){
		f.num = f.num/p;
		f.den = f.den/p;
	}
	while(f.num > p && f.den > p){
		f.num = f.num/10n;
		f.den = f.den/10n;
	}
	if(bool_flip){
		f = f.negate();
	}
	return f;
}


//the following two methods are used in CF to initialize to_decimal_string(decimal_precision)
function to_decimal_string_for_fully_known_that_isnt_finite(a_cf,decimal_precision){
	let [a,b] = [make_fraction(1n,1n), make_fraction(0n,1n)];
	let [c,d] = [make_fraction(0n,1n), make_fraction(1n,1n)];
	let within_precision = false;
	for (var i = 0; ! within_precision; i++) {
		let new_a = a.mul(a_cf.element(i)).add(b);
		let new_c = c.mul(a_cf.element(i)).add(d);
		b = a;
		a = new_a;
		d = c;
		c = new_c;
		if(c.is_non_zero() && d.is_non_zero()){
			within_precision = a.div(c).dist(b.div(d)).is_lt(make_fraction(1n,10n**BigInt(decimal_precision + 1)));
		}
	}
	let ret_frac;
	if(a.mul(c).is_lt(make_fraction(0,1))) ret_frac = a.div(c).sub(make_fraction(5,10n**BigInt(decimal_precision + 1)));
	else       					  ret_frac = a.div(c).add(make_fraction(5,10n**BigInt(decimal_precision + 1)));
	return ret_frac.to_decimal_string(decimal_precision);
}



class CF {
	static toString(){
		return `COMMONLY USED FACTORY METHODS:
static make_cf_from_Fraction(frac), frac should be a Fraction object (from fraction.js).
static make_cf_from_fraction(numerator, denominator), 
	examples: cf.CF.make_cf_from_fraction(13,2)  ->  FiniteCF { frac: Fraction { num: 13n, den: 2n } }.
			  cf.CF.make_cf_from_fraction(-420n,130n)  ->  FiniteCF { frac: Fraction { num: -42n, den: 13n } }.
	i.e. syntactic sugar for initializing a Fraction frac with num = numerator, den = denominator, and then calling make_cf_from_Fraction(frac).
static make_sqrt_of_fraction(num, den, b_, c_), returns square roots of rational numbers. 
	den_, b_, c_,  are  optional parameters. 
	Called with only the argument num: sqrt(num). 
		For example, sqrt(3) = make_sqrt_of_fraction(3)  ->  PeriodicCF { lst_initial: [ 1n ], lst_periodic: [ 1n, 2n ] }
	Called with only the arguments num & den: sqrt(num/den). 
		For example, sqrt(1.5) = make_sqrt_of_fraction(3,2)  ->  PeriodicCF { lst_initial: [ 1n ], lst_periodic: [ 4n, 2n ] }
	Called with all 4 argumentss: (sqrt(num/den)+b_) / (c_).
		For example, the golden ratio = (sqrt(5) + 1)/2 = make_sqrt_of_fraction(5,1,1,2)  ->  PeriodicCF { lst_initial: [], lst_periodic: [ 1n ] }
static make_first_composite_cf(cf,a,b,c,d), 
	i.e. (a*cf + b)/(c*cf + d), for a continued fraction cf.
	Used for arithmetic operations.
static make_second_composite_cf(cfX,cfY,a,b,c,d,e,f,g,h), 
	i.e. (a*cfX*cfY + b*cfX + c*cfY + d)/(e*cfX*cfY + f*cfX + g*cfY + h), for two continued fraction objects cfX, cfY.
	Used for arithmetic operations.
static make_cf_from_method(function_from_nonnegative_indices_to_nonnegative_bigints), 
	for example the constant e: make_cf_from_method((n) => (n===0) ? 2n : (n%3 !== 2) ? 1n : BigInt((2*n+2)/3))  ->  FormulaCF { formula: [Function] }
	Useful for adding new continued fraction identities. Continued fraction identities can be found in the class Constants.

OTHER FACTORY METHODS:
static make_cf_from_integer_continued_fraction_array(num_arr), 
	for example: 10/7 = 1 + 1/(2 + 1/3): make_cf_from_integer_continued_fraction_array([1,2,3])  ->  FiniteCF { frac: Fraction { num: 10n, den: 7n } }. 
	If you wish to make a continued fraction from an infinitely repeating array, use make_cf_from_repeating_pattern instead.
static make_cf_from_integer(n), syntactic sugar for make_cf_from_fraction(n,1).
static make_cf_from_javascript_number(javascript_number, decimal_precision), 
	examples: make_cf_from_javascript_number(0.0123456, 2) -> FiniteCF { frac: Fraction { num: 1n, den: 100n } }
		      make_cf_from_javascript_number(-100.0123456, 2) -> FiniteCF { frac: Fraction { num: -10001n, den: 100n } }
	This method exists for convinience, the unequivocal factory method make_cf_from_fraction is preferable.
static make_cf_from_repeating_pattern(initial_elements_list, repeating_elements_list), 
	for example sqrt of(3): make_cf_from_repeating_pattern([1], [1,2])  ->  PeriodicCF { lst_initial: [ 1n ], lst_periodic: [ 1n, 2n ] }
	The factory method make_sqrt_of_fraction makes this pointless in most cases - unless there's a specific value for which make_sqrt_of_fraction fails.


COMMONLY USED INSTANCE METHODS:
.clone(), note that cloning means that computation done in one instance will not transfer to the other.
.to_decimal_string(decimal_precision), for an integer decimal_precision. 
	Calculates and returns as a string the first decimal_precision decimal points of the CF instance.
	e.g. for e to the power of six we would have: 
		e_6.to_decimal_string(4) -> '403.4288'
		e_6.to_decimal_string(6) -> '403.428793'
.negate(), the cf multiplied by minus one (returns a continued fraction representing that).
.inverse(), one divided by the cf (returns a continued fraction representing that).
.add(cftoadd), cftoadd is a CF instance.
	Returns a continued fraction representing this+cftoadd.
.sub(cftosub), cftosub is a CF instance, returns a continued fraction representing this-cftosub.
.mul(cftomult), cftomult is a CF instance.
	Returns a continued fraction representing this*cftomult.
.div(cftodiv), cftodiv is a CF instance.
	Returns a continued fraction representing this/cftodiv.
.sqrt(), returns the square root of the cf (returns a continued fraction representing that).
.to_text_string(), returns a string description of the CF. Careful: it can get very big very quickly.
.to_text_string2(), returns a smaller string description of the CF. Note: unlike to_text_string, the description is imprecise.

OTHER INSTANCE METHODS:
.to_float(decimal_precision), for an integer decimal_precision. 
	Returns a javascript Number object approximation of the cf.
.element(i),
	Use in CF classes except FiniteCF. Returns the i'th continued fraction series element as a Fraction.
.find_n_elements(n)
	Finds the first n continued fraction series elements if they are not already known.
.add_Fraction(toadd), i.e. syntactic sugar for CF.make_cf_from_Fraction(toadd).add(this).
.add_fraction(num, den), , i.e. syntactic sugar for this.add_Fraction(make_fraction(num,den)).
.length() - Use in CF classes except FiniteCF. Returns the length of the known continued fraction series.
.convergents(n, debug_if_this_is_slow_optional_argument), returns a series of fraction approximations ("convergents").
	Useful for demonstrations but computationaly expensive.`;
	}
	// FACTORY METHODS:
	static make_cf_from_integer_continued_fraction_array(num_arr){
		// Example: 10/7 = 1 + 1/(2 + 1/3):: make_cf_from_integer_continued_fraction_array([1,2,3])  ->  FiniteCF { frac: Fraction { num: 10n, den: 7n } }
		// If you wish to make a continued fraction from an infinitely repeating array, use make_cf_from_repeating_pattern instead.
		let converted_arr = num_arr.map(x => BigInt(x)); //just in case
		let x = fr.Fraction.continued_fraction_list_to_fraction(converted_arr);
		return  new FiniteCF(x);
	}
	// 
	static make_cf_from_Fraction(frac){
		return new FiniteCF(frac);
	}
	static make_cf_from_fraction(numerator, denominator){
		return new FiniteCF(make_fraction(numerator,denominator));
	}
	static make_cf_from_integer(n){
		return new FiniteCF(make_fraction(BigInt(n),1));
	}
	static make_cf_from_javascript_number(javascript_number, decimal_precision){
		//example: make_cf_from_javascript_number(-1238.545642,5)  ->  FiniteCF { frac: Fraction { num: -30963641n, den: 25000n } }
		let num = BigInt(javascript_number.toFixed(decimal_precision)* (10**decimal_precision));
		let den = BigInt(10 ** decimal_precision);
		return new FiniteCF(make_fraction(num, den));
	}
	static make_cf_from_repeating_pattern(initial_elements_list, repeating_elements_list){
		//example: sqrt of 3:: make_cf_from_repeating_pattern([1], [1,2])  ->  PeriodicCF { lst_initial: [ 1n ], lst_periodic: [ 1n, 2n ] }
		initial_elements_list = initial_elements_list.map(x => BigInt(x));
		repeating_elements_list = repeating_elements_list.map(x => BigInt(x));
		return new PeriodicCF(initial_elements_list, repeating_elements_list);
	}
	static make_cf_from_method(function_from_nonnegative_indices_to_nonnegative_bigints){
		//example: the constant e: make_cf_from_method((n) => (n===0) ? 2n : (n%3 !== 2) ? 1n : BigInt((2*n+2)/3))  ->  FormulaCF { formula: [Function] }
		return new FormulaCF(function_from_nonnegative_indices_to_nonnegative_bigints);
	}
	static make_first_composite_cf(cf, a, b, c, d){
		return new FirstCompositeCF(cf,a,b,c,d);
	}
	static make_second_composite_cf(cfX,cfY,a,b,c,d,e,f,g,h){
		return new SecondCompositeCF(cfX,cfY,a,b,c,d,e,f,g,h);
	}
	static is_normalized_cf(cf) {
		return cf.constructor.name === "FiniteCF" 
			|| cf.constructor.name === "PeriodicCF" 
			|| cf.constructor.name === "FormulaCF"
			|| cf.constructor.name === "FirstCompositeCF"
			|| cf.constructor.name === "SecondCompositeCF"
			|| cf.constructor.name === "SqrtCompositeCF"
			|| cf.constructor.name === "GeneralizedCF";
	}
	
	static make_sqrt_of_fraction(num, den, b_, c_){ 
					//den_, b_, c_,  are  optional parameters. 
						//With only num: sqrt(num). 
							//Example: make_sqrt_of_fraction(3)  ->  PeriodicCF { lst_initial: [ 1n ], lst_periodic: [ 1n, 2n ] }
						//With only num & den: sqrt(num/den). 
							//Example: make_sqrt_of_fraction(3,2)  ->  PeriodicCF { lst_initial: [ 1n ], lst_periodic: [ 4n, 2n ] }
						//With everyone: (sqrt(num/den)+b_) / (c_). 
							//Example the golden ratio: ncf.make_sqrt_of_fraction(5,1,1,2)  ->  PeriodicCF { lst_initial: [], lst_periodic: [ 1n ] }

		//zero case:
		if((num === 0 || num === 0n) && b_ === undefined && c_ === undefined) {
			return CF.make_cf_from_fraction(0n,1n);
		}
		else if(num === 0 || num === 0n) {
			return CF.make_cf_from_fraction(b_,c_);
		}
		if(den === undefined) {den = 1n;}
		// Previously, this function failed for rationals that are perfect squares (such as 9/4, 3/2 ** 2 = 9/4).
		// The following block of code uses Math.sqrt() to recognize such a case & solve it, but we require that 
		// 			Number.MIN_SAFE_INTEGER < num,den < Number.MAX_SAFE_INTEGER.
		// Luckily, this restriction should suffice for all practical uses.
		num = BigInt(num);
		den = BigInt(den);
		let num_as_number = Number(num); 
		let den_as_number = Number(den);
		if (   num < BigInt(Number.MAX_SAFE_INTEGER) 
			&& num > BigInt(Number.MIN_SAFE_INTEGER) 
			&& den < BigInt(Number.MAX_SAFE_INTEGER)
			&& den > BigInt(Number.MIN_SAFE_INTEGER)
			&& Math.floor(Math.sqrt(num_as_number/Math.gcd(num_as_number,den_as_number))) * Math.floor(Math.sqrt(num_as_number/Math.gcd(num_as_number,den_as_number))) === num_as_number/Math.gcd(num_as_number,den_as_number) 
			&& Math.floor(Math.sqrt(den_as_number/Math.gcd(num_as_number,den_as_number))) * Math.floor(Math.sqrt(den_as_number/Math.gcd(num_as_number,den_as_number))) === den_as_number/Math.gcd(num_as_number,den_as_number)) {
			let frac = make_fraction(Math.sqrt(num_as_number/Math.gcd(num_as_number,den_as_number)),Math.sqrt(den_as_number/Math.gcd(num_as_number,den_as_number)));
			if(b_ !== undefined && c_ !== undefined){
				frac = frac.add(make_fraction(b_,1n)).div(make_fraction(c_,1n));
			}
			return CF.make_cf_from_Fraction(frac);
		}
		num = BigInt(num);
		den = BigInt(den);
		if(num * den < 0n) throw "CF.make_sqrt_of_fraction() error: num/den must be positive";
		let newtons_method = (bignum_a, bignum_b, frac_p) => {
			let newtons_method_step = (x,a,p,b) => {
				/* The math for a newtons method step is derived as follows: 
				We wish to discover the integer part of 
					bignum_a * sqrt(frac_p) + bignum_b
					(for abbreviation, let's rewrite that as a*sqrt(p)+b ).
				Thus
					x = a sqrt(p) +b
					x-b = a sqrt(p)
					(x-b)^2 = a^2*p
					x^2 - 2xb + b^2 - (a^2)*p = 0
				So for the sake of newtons method step
					f(x) = x^2 - 2xb + b^2 - (a^2)*p
					f'(x) = 2(x-b)
					->
					x{n+1} = x{n} - f(x{n})/f'(x{n}) = ...  
						= [(x{n})^2 - b^2 + (a^2)*p] / [2(x - b)]
				*/
				x.simplify();
				let two_ = make_fraction(2n,1n);
				return x.mul(x).sub(b.mul(b)).add(a.mul(a).mul(p)).div(two_.mul(x.sub(b)));
			}

			let p = frac_p;
			let a_ = make_fraction(bignum_a,1n);
			let b_ = make_fraction(bignum_b,1n);

			let x = a_.mul(a_).mul(p);
			let prev_x = p.add(make_fraction(1n,1n)); // making sure it's initialized to be different from prev_x
			let diff = make_fraction(1n,1n);
			/*until the integer part of the current and previous x are equal (and even then - only if there's no danger of moving 
			   to a different integer later, which we check using diff) perform a newton's method step. 
			*/
			while(x.trunc_to_BigInt() !== prev_x.trunc_to_BigInt() || (x.add(diff).trunc_to_BigInt() !== x.sub(diff).trunc_to_BigInt()) ) {
				diff = x.sub(prev_x);
				prev_x = x;
				x = newtons_method_step(x,a_,p,b_);
			}
			return x.trunc_to_BigInt();
		}

		let history_idx = 0;
		let history = [];
		let find_in_history = (a_,b_,c_) => {
			let res = history.find((e) => {
				let [idx__,n__,a__,b__,c__] = e; 
				return (a_=== a__ && b_=== b__ && c_ === c__);
			});
			if(res === undefined) return undefined;
			else return res[0];
		}
		// a*sqrt(p) + b
		// -------------
		//       c
		let p = make_fraction(num,den); // remains unchanged
		let [a,b,c] = [1n,0n,1n];
		if(b_ !== undefined) {
			b = BigInt(b_);
			c = BigInt(c_);
		}
		
		while(find_in_history(a,b,c) === undefined){
			let res = newtons_method(a,b,p);
			let integer_part = res/c;
			history.push([history_idx++, integer_part, a, b, c]);
			let new_a = a*c*p.den;
			let new_b = (c*c*integer_part - b*c)*p.den;
			let new_c = a*a*p.num + p.den*(-b*b + 2n*b*c*integer_part - c*c*integer_part*integer_part);
			let d = BigInt.gcd(BigInt.gcd(new_a,new_b),new_c);
			[a,b,c] = [new_a/d, new_b/d, new_c/d];
		}
		let repeating_point = find_in_history(a,b,c);
		let init_lst = [];
		let repeating_lst = [];
		for(let i = 0; i < repeating_point; i++){
			init_lst.push(history[i][1]);
		}
		for(let i = repeating_point; i<history.length; i++){
			repeating_lst.push(history[i][1]);
		}
		let out = new PeriodicCF(init_lst,repeating_lst);

		// out.sqrt_of = [num, den, b_, c_]; // incorrect. I need to create a consistent use of the variables b_,c_ / b,c. for now I'm leaving it alone. Reminder: this is here in order to allow optimization.
		return out;
	}

	clone() {
		throw 'Abstract Class CF';
	}
	
	to_decimal_string(decimal_precision){
		if(this.constructor.name === 'FiniteCF')
			return this.frac.to_decimal_string(decimal_precision);
		else if(this.is_fully_known_upon_construction())
			return to_decimal_string_for_fully_known_that_isnt_finite(this, decimal_precision);
		else  
			throw "Abstract Class CF: implement to_decimal_string for not-fully-known objects in their class";
	}

	to_float(decimal_precision){
		return parseFloat(this.to_decimal_string(decimal_precision));
	}
	negate() {
		// @OVERWRITE
		// returns the result of multiplying by -1
		throw 'Abstract Class CF';
	}
	inverse() {
		// @OVERWRITE
		// Returns a new CF which is the multiplicative inverse of the current CF.
		throw 'Abstract Class CF';
	}
	simplify(){
		//ONLY USE IN TESTING!
		return undefined;//overwrite in FirstCompositeCF or SecondCompositeCF to perform gcd on the numerator and denominator and standardize the sign of the coefficients - useful for comparing cf's.
	}
	element(i) {
		// @OVERWRITE
		// if known, returns the CFs i'th element AS A Fraction. Otherwise throws an error.
		throw 'Abstract Class CF';
	}
	find_n_elements(n){
		// @OVERWRITE
		return;
	}
	to_text_string(){
		// @OVERWRITE
		throw 'Abstract Class CF';
	}
	to_text_string2(){
		// @OVERWRITE
		throw 'Abstract Class CF';
	}
	add_Fraction(toadd) {
		return CF.make_cf_from_Fraction(toadd).add(this);
	}
	add_fraction(num, den) {
		return this.add_Fraction(make_fraction(num,den));
	}
	sqrt(){
		//default case:
		return new SqrtCompositeCF(this);
		//for specific cases, overwrite this method.
	}

	//The following 4 charts are initialized by the method "initialize_arithmetics";
	static add_chart=[];
	static sub_chart=[];
	static mul_chart=[];
	static div_chart=[];
	static class_name_to_index(name){
		if(name.constructor.name !== "String"){
			name = name.constructor.name;
		}
		switch(name){
			case "FiniteCF":
				return 0;
			case "PeriodicCF":
				return 1;
			case "FormulaCF":
				return 2;
			case "FirstCompositeCF":
				return 3;
			case "SecondCompositeCF":
				return 4;
			case "SqrtCompositeCF":
				return 5;
			case "GeneralizedCF":
				return 6;
			default:
				return -1;
		}
	}
	add(cftoadd) {
		return CF.add_chart[CF.class_name_to_index(this)][CF.class_name_to_index(cftoadd)](this,cftoadd);
	}
	sub(cftosub) {
		if(this === cftosub) return new FiniteCF(make_fraction(0n,1n));
		return CF.sub_chart[CF.class_name_to_index(this)][CF.class_name_to_index(cftosub)](this,cftosub);
	}
	mul(cftomult){
		return CF.mul_chart[CF.class_name_to_index(this)][CF.class_name_to_index(cftomult)](this,cftomult);
	}
	div(cftodiv){
		if(this === cftodiv) return new FiniteCF(make_fraction(1n,1n));
		return CF.div_chart[CF.class_name_to_index(this)][CF.class_name_to_index(cftodiv)](this,cftodiv);
	}
	length() {
		if(this.constructor.name === FiniteCF) throw "should never be called for FiniteCF";
		else if(this.is_fully_known_upon_construction()) return Infinity;
		else return this.found.length;
	}
	is_fully_known_upon_construction(){
		// @OVERWRITE
		throw 'Abstract Class CF';
		/*
		return value for different CF classes:
			FiniteCF: true.
			PeriodicCF: true.
			FormulaCF: true.
			Composite cases: false.
		*/

	}

	//only useful for demonstrations:
	convergents(n, debug_if_this_is_slow_optional_argument){ 
		// note: in the class FiniteCF the parameter n is optional. For all others it is not.
		let found_ = this.found;
		let out = [];
		if(this.constructor.name==="FiniteCF"){
			if(n === undefined) n = Infinity; 
			if(this.frac.is_zero()) return [make_fraction(0,1)];
			let remainder = this.frac.clone();
			found_ = [];
			while(remainder.den !== 0n){
				let extract = make_fraction (remainder.num / remainder.den, 1n);
				found_.push(extract);
				remainder = remainder.sub(extract).inverse();
			}
			let mat = [make_fraction(1,1),make_fraction(0,1),make_fraction(0,1),make_fraction(1,1)]; //identity
			for(let i=0; i<found_.length && i<n; i++) {
				mat = mat_mul(mat, [found_[i], make_fraction(1,1),make_fraction(1,1),make_fraction(0,1)]);
				out.push(mat[0].div(mat[2]));
			}	
			return out;
		}
		else {
			if(n===undefined || n<1) throw "for CFs other than FiniteCF the method convergents(n) requires a finite positive value n";
			if(! this.is_fully_known_upon_construction()){
				while(this.found.length < n){
					this.find_next();
				}
			}
			let mat = [make_fraction(1,1),make_fraction(0,1),make_fraction(0,1),make_fraction(1,1)]; //identity
			for(let i=0; i<n; i++) {
				mat = mat_mul(mat, [this.element(i), make_fraction(1,1),make_fraction(1,1),make_fraction(0,1)]);
				if(debug_if_this_is_slow_optional_argument){
					console.log(`state: \nmat=${mat}\n, this.element(${i}) = ${this.element(i)}`);
				}
				out.push(mat[0].div(mat[2]));
			}
			return out;
		}
	}
}


//-----------------------<initialize arithmetic charts>-----------------------
function initialize_arithmetics(){
	initialize_add();
	initialize_sub();
	initialize_mul();
	initialize_div();
}
initialize_arithmetics();

function initialize_add(){
	const finite_idx = CF.class_name_to_index("FiniteCF");
	const periodic_idx = CF.class_name_to_index("PeriodicCF");
	const method_idx = CF.class_name_to_index("FormulaCF");
	const first_comp_idx = CF.class_name_to_index("FirstCompositeCF");
	const second_comp_idx = CF.class_name_to_index("SecondCompositeCF");
	const sqrt_idx = CF.class_name_to_index("SqrtCompositeCF");
	const generalized_idx = CF.class_name_to_index("GeneralizedCF");

	//First, initialize the two dimensional array with the default case:
	for(let i = 0; i<=6; i++){
		CF.add_chart[i] = [];
		for(let j = 0; j<=6; j++){
			CF.add_chart[i][j] = (a,b) => {
				if(a===b) return new FirstCompositeCF(a,2n,0n,0n,1n);
				return new SecondCompositeCF(a,b,0n,1n,1n,0n,0n,0n,0n,1n);
			}
		}
	}
	//Next, deal with the special cases, all of which involve the class FiniteCF.
	// if both are finite:
	CF.add_chart[finite_idx][finite_idx] = (a,b) => new FiniteCF(a.frac.add(b.frac));
	//if one of of the objects if a FiniteCF and the other is a PeriodicCF/FormulaCF/GeneralizedCF/SqrtCompositeCF
	let f1 = (a,b) => {
		if(a.is_zero()) return b;
		return new FirstCompositeCF(b, a.frac.den, a.frac.num, 0n, a.frac.den);
	}
	CF.add_chart[finite_idx][periodic_idx] = f1;
	CF.add_chart[periodic_idx][finite_idx] = (b,a) => f1(a,b);
	CF.add_chart[finite_idx][method_idx] = f1;
	CF.add_chart[method_idx][finite_idx] = (b,a) => f1(a,b);
	CF.add_chart[finite_idx][generalized_idx] = f1;
	CF.add_chart[generalized_idx][finite_idx] = (b,a) => f1(a,b);
	CF.add_chart[finite_idx][sqrt_idx] = f1;
	CF.add_chart[sqrt_idx][finite_idx] = (b,a) => f1(a,b);

	//if one of them is a FiniteCF and the other is a FirstCompositeCF:
	CF.add_chart[finite_idx][first_comp_idx] = (a,b) =>{
		if(a.is_zero()) return b;//optimization
		let [a_,b_,c_,d_] = b.initial_matrix_values;
		return new FirstCompositeCF(b.parent_cf, a_*a.frac.den+c_*a.frac.num, d_*a.frac.num+b_*a.frac.den, c_*a.frac.den, d_*a.frac.den);
	}
	CF.add_chart[first_comp_idx][finite_idx] = (b,a) => CF.add_chart[finite_idx][first_comp_idx](a,b);
	CF.add_chart[finite_idx][second_comp_idx] = (a,b) => {
		if(a.is_zero()) return b;//optimization
		let [a__,b__,c__,d__,e__,f__,g__,h__] = b.initial_matrix_values;
		let arr_1 = [a__,b__,c__,d__].map((n)=>n*a.frac.den);
		let arr_2 = [e__,f__,g__,h__].map((n)=>n*a.frac.num);
		var new_numerator_coefficients = arr_1.map((x,idx) => x + arr_2[idx]);

		[a__,b__,c__,d__] = new_numerator_coefficients;
		[e__,f__,g__,h__] = [e__,f__,g__,h__].map((n)=>n*a.frac.den);
		return new SecondCompositeCF(b.cfX,b.cfY,a__,b__,c__,d__,e__,f__,g__,h__);
	}
	CF.add_chart[second_comp_idx][finite_idx] = (b,a) => CF.add_chart[finite_idx][second_comp_idx](a,b);
}

function initialize_sub(){
	const finite_idx = CF.class_name_to_index("FiniteCF");
	const periodic_idx = CF.class_name_to_index("PeriodicCF");
	const method_idx = CF.class_name_to_index("FormulaCF");
	const first_comp_idx = CF.class_name_to_index("FirstCompositeCF");
	const second_comp_idx = CF.class_name_to_index("SecondCompositeCF");
	const sqrt_idx = CF.class_name_to_index("SqrtCompositeCF");
	const generalized_idx = CF.class_name_to_index("GeneralizedCF");

	//First, initialize the two dimensional array with the default case:
	for(let i = 0; i<=6; i++){
		CF.sub_chart[i] = [];
		for(let j = 0; j<=6; j++){
			CF.sub_chart[i][j] = (a,b) => new SecondCompositeCF(a,b,0n,1n,-1n,0n,0n,0n,0n,1n);
		}
	}

	//Next, deal with the special cases, all of which involve the class FiniteCF.
	// if both are finite:
	CF.sub_chart[finite_idx][finite_idx] = (a,b) => new FiniteCF(a.frac.sub(b.frac));
	//if one of of the objects if a FiniteCF and the other is a PeriodicCF/FormulaCF/GeneralizedCF/SqrtCompositeCF
	let f1 = (a,b) => {
		if(a.is_zero()) return b.negate();
		return new FirstCompositeCF(b, - a.frac.den, a.frac.num, 0n, a.frac.den);
	}
	let f2 = (b,a) => {
		if(a.is_zero()) return b.negate();
		return new FirstCompositeCF(b, a.frac.den, - a.frac.num, 0n, a.frac.den);
	}

	CF.sub_chart[finite_idx][periodic_idx] = f1;
	CF.sub_chart[periodic_idx][finite_idx] = f2
	CF.sub_chart[finite_idx][method_idx] = f1;
	CF.sub_chart[method_idx][finite_idx] = f2;
	CF.sub_chart[finite_idx][generalized_idx] = f1;
	CF.sub_chart[generalized_idx][finite_idx] = f2;
	CF.sub_chart[finite_idx][sqrt_idx] = f1;
	CF.sub_chart[sqrt_idx][finite_idx] = f2;

	//if one of them is a FiniteCF and the other is a FirstCompositeCF:
	CF.sub_chart[finite_idx][first_comp_idx] = (a,b) =>{
		if(a.is_zero()) return b.negate();//optimization
		let [a_,b_,c_,d_] = b.initial_matrix_values;
		return new FirstCompositeCF(b.parent_cf, - a_*a.frac.den+c_*a.frac.num, d_*a.frac.num - b_*a.frac.den, c_*a.frac.den, d_*a.frac.den);
	}
	CF.sub_chart[first_comp_idx][finite_idx] = (b,a) =>{
		if(a.is_zero()) return b;//optimization
		let [a_,b_,c_,d_] = b.initial_matrix_values;
		return new FirstCompositeCF(b.parent_cf, - a_*a.frac.den+c_*a.frac.num, d_*a.frac.num - b_*a.frac.den, - c_*a.frac.den, - d_*a.frac.den);
	}

	CF.sub_chart[finite_idx][second_comp_idx] = (a,b) => {
		if(a.is_zero()) return b;//optimization
		let [a__,b__,c__,d__,e__,f__,g__,h__] = b.initial_matrix_values;
		let arr_1 = [a__,b__,c__,d__].map((n)=> - n*a.frac.den);
		let arr_2 = [e__,f__,g__,h__].map((n)=>n*a.frac.num);
		var new_numerator_coefficients = arr_1.map((x,idx) => x + arr_2[idx]);

		[a__,b__,c__,d__] = new_numerator_coefficients;
		[e__,f__,g__,h__] = [e__,f__,g__,h__].map((n)=>n*a.frac.den);
		return new SecondCompositeCF(b.cfX,b.cfY,a__,b__,c__,d__,e__,f__,g__,h__);
	}
	CF.sub_chart[second_comp_idx][finite_idx] = (b,a) => {
		if(a.is_zero()) return b;//optimization
		let [a__,b__,c__,d__,e__,f__,g__,h__] = b.initial_matrix_values;
		let arr_1 = [a__,b__,c__,d__].map((n)=> - n*a.frac.den);
		let arr_2 = [e__,f__,g__,h__].map((n)=>n*a.frac.num);
		var new_numerator_coefficients = arr_1.map((x,idx) => - x - arr_2[idx]);

		[a__,b__,c__,d__] = new_numerator_coefficients;
		[e__,f__,g__,h__] = [e__,f__,g__,h__].map((n)=>n*a.frac.den);
		return new SecondCompositeCF(b.cfX,b.cfY,a__,b__,c__,d__,e__,f__,g__,h__);
	}
}

function initialize_mul(){
	const finite_idx = CF.class_name_to_index("FiniteCF");
	const periodic_idx = CF.class_name_to_index("PeriodicCF");
	const method_idx = CF.class_name_to_index("FormulaCF");
	const first_comp_idx = CF.class_name_to_index("FirstCompositeCF");
	const second_comp_idx = CF.class_name_to_index("SecondCompositeCF");
	const sqrt_idx = CF.class_name_to_index("SqrtCompositeCF");
	const generalized_idx = CF.class_name_to_index("GeneralizedCF");

	//First, initialize the two dimensional array with the default case:
	for(let i = 0; i<=6; i++) {
		CF.mul_chart[i] = [];
		for(let j = 0; j<=6; j++){
			CF.mul_chart[i][j] = (a,b) => new SecondCompositeCF(a,b,1n,0n,0n,0n,0n,0n,0n,1n);
		}
	}
	//Next, deal with the special cases, all of which involve the class FiniteCF.
	// the default for FiniteCF is using FirstCompositeCF:
	for(let i=0; i<=6; i++){
		CF.mul_chart[finite_idx][i] = (a,b) => {
			if(a.frac.is_zero()){ return new FiniteCF(make_fraction(0n,1n));}
			if(a.frac.num === a.frac.den) {return b;}
			return new FirstCompositeCF(b, a.frac.num, 0n, 0n, a.frac.den);
		}
		CF.mul_chart[i][finite_idx] = (b,a) => {
			if(a.frac.is_zero()) {return new FiniteCF(make_fraction(0n,1n));}
			if(a.frac.num === a.frac.den) {return b;}
			return new FirstCompositeCF(b, a.frac.num, 0n, 0n, a.frac.den);
		}
	}
	CF.mul_chart[finite_idx][finite_idx] = (a,b) => new FiniteCF(a.frac.mul(b.frac));

	CF.mul_chart[finite_idx][first_comp_idx] = (a,b) => {
		if(a.frac.is_zero()) return new FiniteCF(make_fraction(0n,1n));
		if(a.frac.num === a.frac.den) return b;
		let [a_,b_,c_,d_] = b.initial_matrix_values;
		return new FirstCompositeCF(b.parent_cf, a.frac.num*a_, a.frac.num*b_, a.frac.den*c_, a.frac.den*d_);
	}
	CF.mul_chart[first_comp_idx][finite_idx] = (b,a) => {
		if(a.frac.is_zero()) return new FiniteCF(make_fraction(0n,1n));
		if(a.frac.num === a.frac.den) return b;
		let [a_,b_,c_,d_] = b.initial_matrix_values;
		return new FirstCompositeCF(b.parent_cf, a.frac.num*a_, a.frac.num*b_, a.frac.den*c_, a.frac.den*d_);
	}
	CF.mul_chart[finite_idx][second_comp_idx] = (a,b) => {
		if(a.frac.is_zero()) return new FiniteCF(make_fraction(0n,1n));
		if(a.frac.num === a.frac.den) return b;
		let [a__,b__,c__,d__,e__,f__,g__,h__] = b.initial_matrix_values;
		[a__,b__,c__,d__] = [a__,b__,c__,d__].map((n)=>n*a.frac.num);
		[e__,f__,g__,h__] = [e__,f__,g__,h__].map((n)=>n*a.frac.den);
		return new SecondCompositeCF(b.cfX,b.cfY,a__,b__,c__,d__,e__,f__,g__,h__);
	}
	CF.mul_chart[second_comp_idx][finite_idx] = (b,a) => {
		if(a.frac.is_zero()) return new FiniteCF(make_fraction(0n,1n));
		if(a.frac.num === a.frac.den) return b;
		let [a__,b__,c__,d__,e__,f__,g__,h__] = b.initial_matrix_values;
		[a__,b__,c__,d__] = [a__,b__,c__,d__].map((n)=>n*a.frac.num);
		[e__,f__,g__,h__] = [e__,f__,g__,h__].map((n)=>n*a.frac.den);
		return new SecondCompositeCF(b.cfX,b.cfY,a__,b__,c__,d__,e__,f__,g__,h__);
	}

}

function initialize_div(){
	const finite_idx = CF.class_name_to_index("FiniteCF");
	const periodic_idx = CF.class_name_to_index("PeriodicCF");
	const method_idx = CF.class_name_to_index("FormulaCF");
	const first_comp_idx = CF.class_name_to_index("FirstCompositeCF");
	const second_comp_idx = CF.class_name_to_index("SecondCompositeCF");
	const sqrt_idx = CF.class_name_to_index("SqrtCompositeCF");
	const generalized_idx = CF.class_name_to_index("GeneralizedCF");

	//First, initialize the two dimensional array with the default case:
	for(let i = 0; i<=6; i++) {
		CF.div_chart[i] = [];
		for(let j = 0; j<=6; j++){
			CF.div_chart[i][j] = (a,b) => new SecondCompositeCF(a,b,0n,1n,0n,0n,0n,0n,1n,0n);
		}
	}
	//Next, deal with the special cases, all of which involve the class FiniteCF.
	// the default for FiniteCF is using FirstCompositeCF:
	for(let i=0; i<=6; i++){
		CF.div_chart[finite_idx][i] = (a,b) => {
			if(a.frac.is_zero()) return new FiniteCF(make_fraction(0n,1n));
			if(a.frac.num === a.frac.den) return b.inverse();
			return new FirstCompositeCF(b, 0n, a.frac.num, a.frac.den, 0n);
		}
		CF.div_chart[i][finite_idx] = (b,a) => {
			if(a.frac.is_zero()) throw "Division of CF by Zero";
			if(a.frac.num === a.frac.den) return b;
			return new FirstCompositeCF(b, a.frac.den, 0n, 0n, a.frac.num);
		}
	}

	CF.div_chart[finite_idx][finite_idx] = (a,b) => new FiniteCF(a.frac.div(b.frac));

	CF.div_chart[finite_idx][first_comp_idx] = (a,b) => {
		if(a.frac.is_zero()) return new FiniteCF(make_fraction(0n,1n));
		if(a.frac.num === a.frac.den) return b.inverse();
		let [a_,b_,c_,d_] = b.initial_matrix_values;
		return new FirstCompositeCF(b.parent_cf, c_*a.frac.num, d_*a.frac.num, a_*a.frac.den, b_*a.frac.den);
	}

	CF.div_chart[first_comp_idx][finite_idx] = (b,a) => {
		if(a.frac.is_zero()) throw "Division of CF by Zero";
		if(a.frac.num === a.frac.den) return b;
		let [a_2,b_2,c_2,d_2] = b.initial_matrix_values;
		return new FirstCompositeCF(b.parent_cf, a_2*a.frac.den, b_2*a.frac.den, c_2*a.frac.num, d_2*a.frac.num);
	}

	CF.div_chart[finite_idx][second_comp_idx] = (a,b) => {
		if(a.frac.is_zero()) return new FiniteCF(make_fraction(0n,1n));
		if(a.frac.num === a.frac.den) return b.inverse();
		let [a__,b__,c__,d__,e__,f__,g__,h__] = b.initial_matrix_values;
		let [_a__,_b__,_c__,_d__] = [e__,f__,g__,h__].map((n) => n*a.frac.num);
		let [_e__,_f__,_g__,_h__] = [a__,b__,c__,d__].map((n) => n*a.frac.den);
		return new SecondCompositeCF(b.cfX,b.cfY, _a__, _b__, _c__, _d__, _e__, _f__, _g__, _h__);
	}

	CF.div_chart[second_comp_idx][finite_idx] = (b,a) => {
		if(a.frac.is_zero()) throw "Division of CF by Zero";
		if(a.frac.num === a.frac.den) return b;
		let [a2__,b2__,c2__,d2__,e2__,f2__,g2__,h2__] = b.initial_matrix_values;
		let [_a2__,_b2__,_c2__,_d2__] = [a2__,b2__,c2__,d2__].map((n) => n*a.frac.den);
		let [_e2__,_f2__,_g2__,_h2__] = [e2__,f2__,g2__,h2__].map((n) => n*a.frac.num);
		return new SecondCompositeCF(b.cfX,b.cfY, _a2__, _b2__, _c2__, _d2__, _e2__, _f2__, _g2__, _h2__);
	}
		
}
//-----------------------</initialize arithmetic charts>-----------------------

class FiniteCF extends CF {
	constructor (frac){
		super();
		frac.simplify();
		if(frac.den === 0n) throw 'ZeroDenominator';
		this.frac = frac;

	}
	clone(){ // n - optional parameter
		return new FiniteCF(this.frac.clone());
	}
	negate(){
		return new FiniteCF(this.frac.negate());
	}
	inverse(){
		return new FiniteCF(this.frac.inverse());//zero pairs are removed automatically by the constructor
	}
	element(i){
		throw "should never be called for FiniteCF";
	}
	to_text_string(){
		return `[Rational Number ${this.frac.to_text_string()}]`;
	}
	to_text_string2(){
		return `[${this.frac.to_text_string()}]`;
	}
	is_fully_known_upon_construction(){
		return true;
	}
	is_zero(){
		return this.frac.is_zero();
	}
	is_non_zero(){
		return this.frac.is_non_zero();
	}	
	sqrt(){
		return CF.make_sqrt_of_fraction(this.frac.num, this.frac.den);
	}

}




class PeriodicCF extends CF {
	constructor(lst_initial, lst_periodic) {//NOTE: BOTH PARAMETERS SHOULD BE BigInt Arrays.
		if(lst_periodic.length === 0)	return new FiniteCF(fr.Fraction.continued_fraction_list_to_fraction(lst_initial));
		super();
		//remove repeated zeroes from the cf and initialize the lists:
		this.lst_initial = Array.remove_zero_pairs(lst_initial);
		this.lst_periodic = Array.remove_zero_pairs(lst_periodic);
		if(this.lst_periodic[0]===0n && this.lst_periodic[this.lst_periodic.length-1]===0n){
			this.lst_initial = this.lst_initial.concat([0n]);
			this.lst_periodic = this.lst_periodic.slice(1,this.lst_periodic.length-1);
		}
			
		else if(this.lst_initial[this.lst_initial.length-1]===0n && this.lst_periodic[0]===0n){
			this.lst_initial = this.lst_initial.slice(0,this.lst_initial.length - 1);
			this.lst_periodic = this.lst_periodic.slice(1).concat([0n]);
		}

		let first_nonzero = lst_periodic.find(element => element !== 0n);
		if(first_nonzero === undefined){
			throw "PeriodicCF expects the periodic list to have at least one non-zero element";
		}
	}
	clone() {
		return new PeriodicCF([...this.lst_initial], [...this.lst_periodic]);
	}
	negate() {
		return new PeriodicCF([...this.lst_initial].map((x)=>-x), [...this.lst_periodic].map((x)=>-x));
	}
	inverse() {
		return new PeriodicCF([0n,...this.lst_initial], [...this.lst_periodic]);//zero pairs are removed automatically by the constructor
	}
	element(i) {
		if (i < this.lst_initial.length) return make_fraction(this.lst_initial[i],1n); 
		i = i - this.lst_initial.length;
		return make_fraction(this.lst_periodic[i % (this.lst_periodic.length)], 1n) ;
	}
	to_text_string() {
		return `[Periodic Continued Fraction - init=[${this.lst_initial}], repeat=[${this.lst_periodic}]]`;
	}
	to_text_string2(){
		return `[${this.lst_initial}, repeat: ${this.lst_periodic}]`
		// return `[${[...this.lst_initial, "repeat: ", ...this.lst_periodic]}]`;
	}
	is_fully_known_upon_construction(){
		return true;
	}
}


class FormulaCF extends CF {
	constructor(formula) {
		super();
		this.formula = formula; 
	}
	clone() {
		return new FormulaCF(this.formula);
	}
	negate() {
		return new FormulaCF((n)=> - this.formula(n));
	}
	inverse() {
		if(this.formula(0) === 0n){
			let new_func1 = (j)=> this.formula(j+1);
			return new FormulaCF((new_func1));
		}
		else {
			let new_func2 = (j)=>{
				if(j===0) return 0n;
				else      return this.formula(j-1);
			}
			return new FormulaCF(new_func2);
		}
	}
	element(i) {
		return make_fraction(this.formula(i),1n);
	}
	to_text_string(){
		return "[Formula CF. Formula: " + this.formula.toString() + "]";
	}
	to_text_string2(){
		return "[Formula CF. Formula: " + this.formula.toString() + "]";
	}
	is_fully_known_upon_construction(){
		return true;
	}
}


// class IntervalWrapperCF extends CF {
// 	constructor(cf, _mat, _index) { //_mat and _index are optional parameters.
// 		super();
// 		this.cf = cf;
// 		if(_mat === undefined){[this.num1,this.den1,this.num2,this.den2] = [1n,0n,0n,1n]}
// 		else {this.mat = [..._mat]}
// 		if(_index === undefined){this.index = 0}
// 		else {this.index = _index}
// 	}
// 	clone() {
// 		return new IntervalWrapperCF(this.cf.clone(), [this.mat], this.index);
// 	}
// 	negate() {
// 		return new IntervalWrapperCF(this.cf.negate(), [this.mat].map((x)=>-x), this.index);
// 	}
// 	inverse() {
// 		if(this.formula(0) === 0n){
// 			let new_func1 = (j)=> this.formula(j+1);
// 			return new FormulaCF((new_func1));
// 		}
// 		else {
// 			let new_func2 = (j)=>{
// 				if(j===0) return 0n;
// 				else      return this.formula(j-1);
// 			}
// 			return new FormulaCF(new_func2);
// 		}
// 	}
// 	element(i) {
// 		return make_fraction(this.formula(i),1n);
// 	}
// 	to_text_string(){
// 		return "[Formula CF. Formula: " + this.formula.toString() + "]";
// 	}
// 	to_text_string2(){
// 		return "[Formula CF. Formula: " + this.formula.toString() + "]";
// 	}
// 	is_fully_known_upon_construction(){
// 		return true;
// 	}
// }


class FirstCompositeCF extends CF {
	// Given a normalized cf X, this CF will be 
	//   (aX + b)   
	//   --------
	//   (cX + d)
	//
	//   ...using Gospers first algorithm (hence First composite).
//
	// Rather than use Gospers algorithm verbatim, 
	//    which finds the next number in the continued fraction by comparing the integer parts of a/c to b/d and demanding they be equal, 
	//    we demand that the distance between the fractions a/c and b/d be smaller than a small fraction,
	//    and then we choose a/c as the next number in the continued fraction.
//
	// Note: no detection of cycles.
//
	// Note: For simplicity, FirstCompositeCF can only handle INFINTE source-cfs. 
	//    Arithmetics with Finite CFs should be handled by constructing the appropriate FirstCompositeCF in add/mul/div/sub. 
//	

	constructor(cf, a, b, c, d, found_, index_, initial_matrix_values_, top_){ ///found_, index_ = optional parameters. Useful for arithmetics with FiniteCF/cloning operations.
		super();
		if(! CF.is_normalized_cf(cf)) throw "FirstCompositeCF must be initialized with a normalized cf";
		//initialize matrix   |a b|
		//                    |c d| 
		[this.a, this.b, this.c, this.d] = [BigInt(a), BigInt(b), BigInt(c), BigInt(d)];
		
		if(this.c === 0n && this.d === 0n) throw "zero denominator (in FirstCompositeCF constructor)";
		else if(this.a === 0n && this.b === 0n) return new FiniteCF(make_fraction(0,1)); //zero numerator
		else if(this.a === 0n && this.c === 0n){
			return new CF.make_cf_from_fraction(this.b, this.d);
		} 
		else if(this.b === 0n && this.d === 0n){
			return new CF.make_cf_from_fraction(this.a, this.c);
		}
		else if(this.b === 0n && this.c === 0n && this.a === this.d){
			return cf.clone();
		}
		else{
			let gcd_val = BigInt.abs(BigInt.gcd(BigInt.gcd(this.a,this.b), BigInt.gcd(this.c,this.d)));
			this.a = this.a/gcd_val;
			this.b = this.b/gcd_val;
			this.c = this.c/gcd_val;
			this.d = this.d/gcd_val;

		}
		if(top_ === undefined) [this.top_a, this.top_b, this.top_c, this.top_d] = [this.a,this.b,this.c,this.d]; // used for to_decimal_string(decimal_precision)
		else [this.top_a, this.top_b, this.top_c, this.top_d] = top_;
		//initialize parent_cf, i.e. the generating cf X :
		this.parent_cf = cf;
		//initialize found:
		if (found_ === undefined) this.found = [];// an array of Fraction Objects.
		else this.found = found_;					  

		if(index_ === undefined) this.index = 0;
		else 					 this.index = index_;
		if(initial_matrix_values_ === undefined) this.initial_matrix_values = [this.a,this.b,this.c,this.d];// // remember, in case we wish to "restart" the cf 
		else 									 this.initial_matrix_values = initial_matrix_values_;// in case you're wondering, see use in in CF.add and in other arithmetic operations
		this.precision_per_num = make_fraction(1n,6n); 
	}

	clone() {
		return new FirstCompositeCF(this.parent_cf,this.a,this.b,this.c,this.d, this.found.map((x)=>x.clone()), this.index, 
			[...this.initial_matrix_values], [this.top_a, this.top_b, this.top_c, this.top_d]);
	}

	to_decimal_string(decimal_precision){
		let decimal_precision_as_fraction = make_fraction(1n,10n**BigInt(decimal_precision + 1));
		let frac_a_c;
		let frac_b_d;

		let within_precision;
		if(this.top_c !== 0n && this.top_d !== 0n){
			frac_a_c = make_fraction(this.top_a,this.top_c);
				frac_b_d = make_fraction(this.top_b,this.top_d);
				within_precision = frac_a_c.dist(frac_b_d).is_lt(decimal_precision_as_fraction);
		}
		else within_precision = false; // why not just set within_precision to false in all cases? Because then we'd execute this.find_next() automatically, even if unnecessary.
		while(! within_precision){
			this.find_next();
			if(this.top_c !== 0n && this.top_d !== 0n){
				frac_a_c = make_fraction(this.top_a,this.top_c);
				frac_b_d = make_fraction(this.top_b,this.top_d);
				within_precision = frac_a_c.dist(frac_b_d).is_lt(decimal_precision_as_fraction);
			}
		}
		let ret_frac = make_fraction(this.top_a,this.top_c);
		if(ret_frac.num < 0n){
			ret_frac = ret_frac.sub(make_fraction(5n,10n**BigInt(decimal_precision + 1)));
		}
		else{
			ret_frac = ret_frac.add(make_fraction(5n,10n**BigInt(decimal_precision + 1)));
		}
		return ret_frac.to_decimal_string(decimal_precision);
	}
	negate() {
		let new_init_matrix = this.initial_matrix_values.map((elem,idx)=> idx<2 ? -elem : elem); 
		return new FirstCompositeCF(this.parent_cf, -this.a, -this.b, this.c, this.d, this.found.map((x)=>x.negate()), this.index, 
			new_init_matrix, [-this.top_a, -this.top_b, this.top_c, this.top_d]);
	}
	inverse() {
		let new_init_matrix = [this.initial_matrix_values[2], this.initial_matrix_values[3], this.initial_matrix_values[0], this.initial_matrix_values[1]];
			return new FirstCompositeCF(this.parent_cf, this.c, this.d, this.a, this.b, [0n].concat(this.found.map((x)=>x.clone())), this.index,
				new_init_matrix, [this.top_c, this.top_d, this.top_a, this.top_b]);		
	}
	simplify(){
		//USE IN TESTING ONLY
		let gcd_val = BigInt.abs(BigInt.gcd(BigInt.gcd(this.a,this.b), BigInt.gcd(this.c,this.d)));
		[this.a,this.b,this.c,this.d] = [this.a/gcd_val, this.b/gcd_val, this.c/gcd_val, this.d/gcd_val];
		if(this.a<0n){
			[this.a,this.b,this.c,this.d] = [-this.a,-this.b,-this.c,-this.d];
		}
		else if(this.a === 0n && this.b < 0n){
			[this.a,this.b,this.c,this.d] = [-this.a,-this.b,-this.c,-this.d];
		}
	}
	element(i) {
		while (this.length() < i+1) this.find_next();
		return this.found[i];
	}
	to_text_string(){
		return `[FirstCompositeCF. Found so far: [${this.found}], parent_cf:${this.parent_cf.to_text_string()}, remaining computation: index in parent_cf = ${this.index}, (${this.a}*parent_cf + ${this.b}) / (${this.c}*parent_cf + ${this.d})]`;
	}
	to_text_string2(){
		return `[Found: [${this.found.map((x)=>" "+x.to_text_string())} ], parent_cf:${this.parent_cf.to_text_string2()}, index in parent_cf = ${this.index}, (${BigInt.toFloatString(this.a)}*parent_cf + ${BigInt.toFloatString(this.b)}) / (${BigInt.toFloatString(this.c)}*parent_cf + ${BigInt.toFloatString(this.d)})]`;
	}
	is_fully_known_upon_construction(){
		return false;
	}
	find_next(){
		//not guarenteed to find the next number! Performs a single algorithmic step.

		//first, if we don't have parent cf [index], find it:
		while(! (this.index < this.parent_cf.length() + 1)){
			this.parent_cf.find_next();
		}

		if(this.index % 6 === 0){
			let gcd = BigInt.gcd(BigInt.gcd(this.a, this.b), BigInt.gcd(this.c, this.d));
			gcd = BigInt.abs(gcd);
			[this.a, this.b, this.c, this.d] = [this.a/gcd, this.b/gcd, this.c/gcd, this.d/gcd];
		}
		if((this.c !== 0n && this.d !== 0n) && ((this.a/this.c) === (this.b/this.d) || fr.Fraction.distance(this.a,this.c,this.b,this.d).is_lt(this.precision_per_num))){
			let newly_found_val; 
			if(this.a/this.c === this.b/this.d){
				newly_found_val = make_fraction(this.a,this.c);//the choice might seem arbitrary, since we could also use b/d, but this consistency works in our favor when performing inverse() & negate(), allowing us to retain the results from the found array.
			}
			else{
				newly_found_val = make_fraction(this.a/this.c, 1n);
			}
			let new_a_row = this.c * newly_found_val.den;
			let new_b_row = this.d * newly_found_val.den;
			let new_c_row = this.a * newly_found_val.den - this.c * newly_found_val.num;
			let new_d_row = this.b * newly_found_val.den - this.d * newly_found_val.num;
			this.a = new_a_row;
			this.b = new_b_row;
			this.c = new_c_row;
			this.d = new_d_row;
			this.found.push(newly_found_val);
			return newly_found_val;
		}
		//2. :::
		let e = this.parent_cf.element(this.index); 
		let new_a_column = this.a * e.num + this.b * e.den;
		let new_b_column = this.a * e.den;
		let new_c_column = this.c * e.num + this.d * e.den;
		let new_d_column = this.c * e.den;
		let new_top_a = this.top_a * e.num + this.top_b * e.den;
		let new_top_b = this.top_a * e.den;
		let new_top_c = this.top_c * e.num + this.top_d * e.den;
		let new_top_d = this.top_c * e.den;
		[this.a,this.b,this.c,this.d] = [new_a_column, new_b_column, new_c_column, new_d_column];
		[this.top_a,this.top_b,this.top_c,this.top_d] = [new_top_a, new_top_b, new_top_c, new_top_d];
		this.index++ ;
		return;
	}
	find_n_elements(n){
		while((this.found.length < n))	this.find_next();
	}
	sqrt(){
		//since SqrtCompositeCF is expensive, it is best to apply it on the least composite cf possible.
		let [_a,_b,_c,_d] = this.initial_matrix_values;
		if(_a === 0n && _d === 0n){
			//       b
			// -------------
			// c * parent_cf
			let y = CF.make_sqrt_of_fraction(_b,_c);
			let sqrt_parent = new SqrtCompositeCF(this.parent_cf.inverse());
			return y.mul(sqrt_parent);
		}
		else if(_b === 0n && _c === 0n){
			// a * parent_cf
			// -------------
			//       d      
			let y = CF.make_sqrt_of_fraction(_a,_d);
			let sqrt_parent = new SqrtCompositeCF(this.parent_cf);
			return y.mul(sqrt_parent);
		}
		else{
			//default case:
			return new SqrtCompositeCF(this);
		}
	}
}



//cf, a, b, c, d, found_, index_, initial_matrix_values_, top_
class SecondCompositeCF extends CF {
	// Given 2 normalized CFs X,Y, this CF will be 
	//   (aXY + bX + cY + d)   
	//   -------------------
	//   (eXY + fX + gY + h)
	//
	//   ...using Gospers first algorithm (hence First composite).
	// no detection of cycles.
	// keeps a history.
	//NOTE: For efficiency reasons, SecondCompositeCF can only handle INFINTE source cfs. Arithmetics with Finite CFs should be handled using add/mul/div/sub.
	constructor(cfX,cfY, a, b, c, d, e, f , g, h, found_, index_X_, index_Y_, initial_matrix_values_, top_){ ///found_, index_X, index_Y, initial_matrix_values, top_ = optional parameters. Useful for arithmetics with FiniteCF/cloning operations.
		super();

		if(! CF.is_normalized_cf(cfX)) throw "SecondCompositeCF must be initialized with a normalized cf cfX";
		if(! CF.is_normalized_cf(cfY)) throw "SecondCompositeCF must be initialized with a normalized cf cfY";

		//initialize matrix   |a    b  |
		//                    |  e    f|
		//					  | 	   |
		// 					  |c    d  |
		// 					  |  g    h|
		[this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] = [BigInt(a), BigInt(b), BigInt(c), BigInt(d), BigInt(e), BigInt(f), BigInt(g), BigInt(h)];
		if(this.e === 0n && this.f === 0n && this.g === 0n && this.h === 0n) throw "zero denominator (in SecondCompositeCF constructor)";
		else if(this.a === 0n && this.b === 0n && this.c === 0n && this.d === 0n) return new FiniteCF(make_fraction(0,1)); //zero numerator
		else if(this.b === 0n && this.c === 0n && this.d === 0n &&  this.f === 0n && this.g === 0n && this.h === 0n){
			return new CF.make_cf_from_fraction(this.a, this.e);
		} 
		else if(this.a === 0n && this.c === 0n && this.d === 0n && this.e === 0n && this.g === 0n && this.h === 0n){
			return new CF.make_cf_from_fraction(this.b, this.f);
		} 
		else if(this.a === 0n && this.b === 0n && this.d === 0n && this.e === 0n && this.f === 0n && this.h === 0n){
			return new CF.make_cf_from_fraction(this.c, this.g);
		} 
		else if(this.a === 0n && this.b === 0n && this.c === 0n && this.e === 0n && this.f === 0n && this.g === 0n){
			return new CF.make_cf_from_fraction(this.d, this.h);
		}
		else{
			let gcd_val = BigInt.abs(BigInt.gcd(BigInt.gcd(BigInt.gcd(this.a,this.b),BigInt.gcd(this.c,this.d)) , BigInt.gcd(BigInt.gcd(this.e,this.f),BigInt.gcd(this.g,this.h))));
			this.a = this.a/gcd_val;
			this.b = this.b/gcd_val;
			this.c = this.c/gcd_val;
			this.d = this.d/gcd_val;
			this.e = this.e/gcd_val;
			this.f = this.f/gcd_val;
			this.g = this.g/gcd_val;
			this.h = this.h/gcd_val;
		}
		if(top_ === undefined)	[this.top_a, this.top_b, this.top_c, this.top_d, this.top_e, this.top_f, this.top_g, this.top_h] = [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h];// used for to_decimal_string(decimal_precision)
		else [this.top_a, this.top_b, this.top_c, this.top_d, this.top_e, this.top_f, this.top_g, this.top_h] = top_;
		//initialize the generating cfs cfX,cfY:
		this.cfX = cfX;
		this.cfY = cfY;
		//initialize found:
		if (found_ === undefined) this.found = [];
		else					  this.found = found_;

		if(index_X_ === undefined) this.index_X = 0;
		else 					   this.index_X = index_X_;
		if(index_Y_ === undefined) this.index_Y = 0;
		else 					   this.index_Y = index_Y_;
		if(initial_matrix_values_ === undefined) {
					this.initial_matrix_values = [this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h];}// // remember, in case we wish to "restart" the cf.
		else    	{this.initial_matrix_values = initial_matrix_values_;}
		this.precision_per_num = make_fraction(1n,6n); 
	}

	clone() {
		return new SecondCompositeCF(this.cfX, this.cfY, 
			this.a, this.b, this.c, this.d, 
			this.e, this.f , this.g, this.h, 
			this.found.map((x)=>x.clone()), this.index_X, this.index_Y, [...this.initial_matrix_values], 
			[this.top_a,this.top_b,this.top_c,this.top_d,
			  this.top_e,this.top_f,this.top_g,this.top_h]);
	}
	to_decimal_string(decimal_precision){
		let decimal_precision_as_fraction = make_fraction(1n,10n**BigInt(decimal_precision + 1));
		let frac1,frac2,frac3,frac4;

		let within_precision;
		if(this.top_e !== 0n && this.top_f !== 0n && this.top_g !== 0n && this.top_h !== 0n){
			frac1 = make_fraction(this.top_a,this.top_e);
			frac2 = make_fraction(this.top_b,this.top_f);
			frac3 = make_fraction(this.top_c,this.top_g);
			frac4 = make_fraction(this.top_d,this.top_h);
			within_precision = 
			  frac1.sub(frac2).abs().is_lt(decimal_precision_as_fraction)
			  && frac1.dist(frac3).is_lt(decimal_precision_as_fraction)
			  && frac1.dist(frac4).is_lt(decimal_precision_as_fraction)
			  && frac2.dist(frac3).is_lt(decimal_precision_as_fraction)
			  && frac2.dist(frac4).is_lt(decimal_precision_as_fraction)
			  && frac3.dist(frac4).is_lt(decimal_precision_as_fraction);
		}
		else {within_precision = false;}// why not just set within_precision to false in all cases? Because then we'd execute this.find_next() automatically, even if unnecessary.

		while(! within_precision){
			//TODO FIXXXXXXXXXX - -----THIS IS SLOWING EVERYTHING DOWN!!!!!!!!!!!!!!!!!!!!!!!!!!!
			this.find_next();
			if(this.top_e !== 0n && this.top_f !== 0n && this.top_g !== 0n && this.top_h !== 0n){
				frac1 = make_fraction(this.top_a,this.top_e);
				frac2 = make_fraction(this.top_b,this.top_f);
				frac3 = make_fraction(this.top_c,this.top_g);
				frac4 = make_fraction(this.top_d,this.top_h);
				within_precision = 
				  frac1.sub(frac2).abs().is_lt(decimal_precision_as_fraction)
				  && frac1.dist(frac3).is_lt(decimal_precision_as_fraction)
				  && frac1.dist(frac4).is_lt(decimal_precision_as_fraction)
				  && frac2.dist(frac3).is_lt(decimal_precision_as_fraction)
				  && frac2.dist(frac4).is_lt(decimal_precision_as_fraction)
				  && frac3.dist(frac4).is_lt(decimal_precision_as_fraction);			  
			}
		}
		let ret_frac = make_fraction(this.top_a,this.top_e);
		if(ret_frac.num < 0n){
			ret_frac = ret_frac.sub(make_fraction(5n,10n**BigInt(decimal_precision + 1)));
		}
		else{
			ret_frac = ret_frac.add(make_fraction(5n,10n**BigInt(decimal_precision + 1)));
		}
		return ret_frac.to_decimal_string(decimal_precision);
	}

	negate() {		
		let new_init_matrix = this.initial_matrix_values.map((elem,idx)=> idx<4 ? -elem : elem); 
		return new SecondCompositeCF(
			this.cfX, this.cfY, 
			-this.a, -this.b, -this.c, -this.d, 
			this.e, this.f , this.g, this.h, 
			[...this.found].map((x)=>x.negate()), 
			this.index_X, this.index_Y, 
			new_init_matrix, 
			[-this.top_a, -this.top_b, -this.top_c, -this.top_d, 
			   this.top_e,  this.top_f ,  this.top_g,  this.top_h]);
	}
	inverse() {
		let new_init_matrix = [this.initial_matrix_values[4], this.initial_matrix_values[5], this.initial_matrix_values[6], this.initial_matrix_values[7], this.initial_matrix_values[0], this.initial_matrix_values[1], this.initial_matrix_values[2], this.initial_matrix_values[3]];
		return new SecondCompositeCF(this.cfX, this.cfY, 
			this.e, this.f, this.g, this.h, 
			this.a, this.b, this.c, this.d, 
			[0n].concat(this.found.map((x)=>x.clone())),
			this.index_X, this.index_Y, 
			new_init_matrix, 
			[this.top_e,this.top_f,this.top_g,this.top_h,this.top_a,this.top_b,this.top_c,this.top_d]);
	}
	simplify(){
		//USE IN TESTING ONLY
		let gcd_num = BigInt.abs(BigInt.gcd(BigInt.gcd(this.a,this.b), BigInt.gcd(this.c,this.d)));
		let gcd_den = BigInt.abs(BigInt.gcd(BigInt.gcd(this.e,this.f), BigInt.gcd(this.g,this.h)));
		let gcd_val = BigInt.gcd(gcd_num, gcd_den);
		[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] = 
			[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=>x/gcd_val);
		if(this.a<0n){
			[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] = [this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=>-x);
		}
		else if(this.a === 0n && this.b < 0n){
			[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] = [this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=>-x);
		}
		else if(this.a === 0n && this.b === 0n && this.c < 0n){
			[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] = [this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=>-x);
		}
		else if(this.a === 0n && this.b === 0n && this.c === 0n && this.d < 0n){
			[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] = [this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=>-x);
		}
	}
	element(i) {
		while (this.length() < i+1) this.find_next();
		return this.found[i];
	}
	to_text_string(){
		return `[SecondCompositeCF. Found so far: [${this.found}], cfX:${this.cfX.to_text_string()}, cfY:${this.cfY.to_text_string()}, remaining computation: index in cfX = ${this.index_X}, index in cfY = ${this.index_Y}, (${this.a}*XY + ${this.b}*X + ${this.c}*Y + ${this.d}) / (${this.e}*XY + ${this.f}*X + ${this.g}*Y + ${this.h})]`;
	}
	to_text_string2(){
		return `[Found so far: [${this.found.map((x)=>" "+x.to_text_string2())} ], cfX:${this.cfX.to_text_string2()}, cfY:${this.cfY.to_text_string2()}, remaining computation: index in cfX = ${this.index_X}, index in cfY = ${this.index_Y}, (${BigInt.toFloatString(this.a)}*XY + ${BigInt.toFloatString(this.b)}*X + ${BigInt.toFloatString(this.c)}*Y + ${BigInt.toFloatString(this.d)}) / (${BigInt.toFloatString(this.e)}}*XY + ${BigInt.toFloatString(this.f)}*X + ${BigInt.toFloatString(this.g)}*Y + ${BigInt.toFloatString(this.h)})]`;
	}


	is_fully_known_upon_construction(){
		return false;
	}
	find_next(){
		//not guarenteed to find the next number! Performs a single algorithmic step.
		//first, if we don't have cfX[index_X], find it, then do the same for cfY[index_Y]:
		while( ! (this.index_X < this.cfX.length() + 1)){
			this.cfX.find_next();
		}
		while(! (this.index_Y < this.cfY.length() + 1)){
			this.cfY.find_next();
		}

		if((this.index_X + this.index_Y) % 6 === 0){
			let gcd = [this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].reduce((prev,curr)=>BigInt.gcd(prev,curr));
			gcd = BigInt.abs(gcd);
			[this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] = [this.a/gcd, this.b/gcd, this.c/gcd, this.d/gcd, this.e/gcd, this.f/gcd, this.g/gcd, this.h/gcd];
		}
		//next, perform a step.
		
		//1. if we are close enough to extract a number, do so.
		//2. else if (the top/bottom row denominators are zero) OR (b/f ~~ d/h AND a/e ~~ c/g, meaning their close enough to each other) advance down & incremenet index_Y.
		//3. else advance left & increment index_X.
		//1. :::
		let bool_non_zero_denominators = this.e !== 0n && this.f !== 0n && this.g !== 0n && this.h !== 0n;
		
		let same_integer_part = () =>{
			return ((this.a/this.e) === (this.b/this.f)) && ((this.c/this.g) === (this.d/this.h)) && ((this.a/this.e) === (this.c/this.g)); //set as a function for delayed computation :D
		}
		let bool_close_fractions = ()=> { //set as a function for delayed computation :D
			let fracs = [make_fraction(this.a,this.e),
							make_fraction(this.b,this.f),
							make_fraction(this.c,this.g),
							make_fraction(this.d,this.h)];
			return fr.Fraction.min(fracs).dist(fr.Fraction.max(fracs)).is_lt(this.precision_per_num);
		}
		if(bool_non_zero_denominators &&  (same_integer_part() || bool_close_fractions())){
			let newly_found_val;
			if(same_integer_part()){
				newly_found_val = make_fraction(this.a/this.e, 1n);
			}
			else{
				newly_found_val = fraction_simplifier(make_fraction(this.a,this.e),4);//the choice might seem arbitrary, since we could also use b/d, but this consistency works in our favor when performing inverse() & negate(), allowing us to retain the results from the found array.
				if(newly_found_val.num > 10n ** 6n && newly_found_val.den > 10n ** 6n){
					console.log(`ERROR: ${newly_found_val.to_text_string()}`);
				}
			}

			let new_a = newly_found_val.den * this.e;
			let new_b = newly_found_val.den * this.f;
			let new_c = newly_found_val.den * this.g;
			let new_d = newly_found_val.den * this.h;
			let new_e = (newly_found_val.den * this.a) - (newly_found_val.num * this.e);
			let new_f = (newly_found_val.den * this.b) - (newly_found_val.num * this.f);
			let new_g = (newly_found_val.den * this.c) - (newly_found_val.num * this.g);
			let new_h = (newly_found_val.den * this.d) - (newly_found_val.num * this.h);
			[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] =
				[new_a,new_b,new_c,new_d,new_e,new_f,new_g,new_h];
			let gcd = [this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].reduce((prev,curr)=>BigInt.gcd(prev,curr));
			gcd = BigInt.abs(gcd);
			[this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] = [this.a/gcd, this.b/gcd, this.c/gcd, this.d/gcd, this.e/gcd, this.f/gcd, this.g/gcd, this.h/gcd];
			this.found.push(newly_found_val);
			return newly_found_val;
		}
		else if ((this.e === 0n && this.g === 0n) || (this.f === 0n && this.h === 0n) || 
				 (bool_non_zero_denominators && 
				 fr.Fraction.distance(this.b,this.f,this.d,this.h).is_lt(this.precision_per_num) &&
				 fr.Fraction.distance(this.a,this.e,this.c,this.g).is_lt(this.precision_per_num)) ||
				 ((this.index_Y < this.index_X+80) && (this.index_X + this.index_Y)%2===0)) {
			//2. ::: move down, i.e. in the direction of cfY
			let eY = this.cfY.element(this.index_Y);
			let new_a_row = (this.a * eY.num) + (this.b * eY.den);
			let new_b_row =  this.a * eY.den;
			let new_c_row = (this.c * eY.num) + (this.d * eY.den);
			let new_d_row =  this.c * eY.den;
			let new_e_row = (this.e * eY.num) + (this.f * eY.den);
			let new_f_row =  this.e * eY.den;
			let new_g_row = (this.g * eY.num) + (this.h * eY.den);
			let new_h_row =  this.g * eY.den;

			let new_top_a = (this.top_a * eY.num) + (this.top_b * eY.den);
			let new_top_b =  this.top_a * eY.den;
			let new_top_c = (this.top_c * eY.num) + (this.top_d * eY.den);
			let new_top_d =  this.top_c * eY.den;
			let new_top_e = (this.top_e * eY.num) + (this.top_f * eY.den);
			let new_top_f =  this.top_e * eY.den;
			let new_top_g = (this.top_g * eY.num) + (this.top_h * eY.den);
			let new_top_h =  this.top_g * eY.den;

			[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] = 
				[new_a_row, new_b_row, new_c_row, new_d_row, new_e_row, new_f_row, new_g_row, new_h_row];
			[this.top_a,this.top_b,this.top_c,this.top_d,this.top_e,this.top_f,this.top_g,this.top_h] = 
				[new_top_a, new_top_b, new_top_c, new_top_d, new_top_e, new_top_f, new_top_g, new_top_h];
			this.index_Y ++ ;
			return;
		}
		else {
			//3. ::: move left, i.e. in the direction of cfX
			let eX = this.cfX.element(this.index_X);
			let new_a_col = (this.a * eX.num) + (this.c * eX.den);
			let new_b_col = (this.b * eX.num) + (this.d * eX.den);
			let new_c_col =  this.a * eX.den;
			let new_d_col =  this.b * eX.den;
			let new_e_col = (this.e * eX.num) + (this.g * eX.den);
			let new_f_col = (this.f * eX.num) + (this.h * eX.den);
			let new_g_col =  this.e * eX.den;
			let new_h_col =  this.f * eX.den;

			let new_top_a2 = (this.top_a * eX.num) + (this.top_c * eX.den);
			let new_top_b2 = (this.top_b * eX.num) + (this.top_d * eX.den);
			let new_top_c2 =  this.top_a * eX.den;
			let new_top_d2 =  this.top_b * eX.den;
			let new_top_e2 = (this.top_e * eX.num) + (this.top_g * eX.den);
			let new_top_f2 = (this.top_f * eX.num) + (this.top_h * eX.den);
			let new_top_g2 =  this.top_e * eX.den;
			let new_top_h2 =  this.top_f * eX.den;

			[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] = 
				[new_a_col, new_b_col, new_c_col, new_d_col, new_e_col, new_f_col, new_g_col, new_h_col];
			[this.top_a,this.top_b,this.top_c,this.top_d,this.top_e,this.top_f,this.top_g,this.top_h] = 
				[new_top_a2, new_top_b2, new_top_c2, new_top_d2, new_top_e2, new_top_f2, new_top_g2, new_top_h2];
			this.index_X ++ ;
			return;
		}
	}
	find_n_elements(n){
		while((this.found.length < n))	this.find_next();
	}
	sqrt(){
		//since SqrtCompositeCF is expensive, it is best to apply it on the least composite cf possible.
		let [_a,_b,_c,_d,_e,_f,_g,_h] = this.initial_matrix_values;
		//multiplication case:
		if(_a !== 0n && _h !== 0n && _b === 0n && _c === 0n && _d === 0n && _e === 0n && _f === 0n && _g === 0n){
			//   (aXY + 0X + 0Y + 0)   
			//   ------------------- = aXY/h  =>  sqrt(aXY/h)= sqrt(a/h)*sqrt(X)*sqrt(Y)
			//   (0XY + 0X + 0Y + h)
			let sqrt_frac = CF.make_sqrt_of_fraction(_a,_h);
			let sqrt_cfx = this.cfX.sqrt();
			let sqrt_cfy = this.cfY.sqrt();
			return sqrt_frac.mul(sqrt_cfx).mul(sqrt_cfy);
		}
		//division case #1:
		else if(_b !== 0n && _g !== 0n && _a === 0n && _c === 0n && _d === 0n && _e === 0n && _f === 0n && _h === 0n){
			//   (0XY + bX + 0Y + 0)   
			//   ------------------- = bX/gY  =>  sqrt(bX/gY)= sqrt(b/g)*sqrt(X)/sqrt(Y)
			//   (0XY + 0X + gY + 0)
			let sqrt_frac = CF.make_sqrt_of_fraction(_b,_g);
			let sqrt_cfx = this.cfX.sqrt();
			let sqrt_cfy = this.cfY.sqrt();
			return sqrt_frac.mul(sqrt_cfx).div(sqrt_cfy);
		}
		//division case #2:
		else if(_c !== 0n && _f !== 0n && _a === 0n && _b === 0n && _d === 0n && _e === 0n && _g === 0n && _h === 0n){
			//   (0XY + 0X + cY + 0)   
			//   ------------------- = cY/fX  =>  sqrt(cY/fX)= sqrt(c/f)*sqrt(Y)/sqrt(X)
			//   (0XY + fX + 0Y + 0)
			let sqrt_frac = CF.make_sqrt_of_fraction(_c,_f);
			let sqrt_cfx = this.cfX.sqrt();
			let sqrt_cfy = this.cfY.sqrt();
			return sqrt_frac.mul(sqrt_cfy).div(sqrt_cfx);
		}
		else{
			//default case:
			return new SqrtCompositeCF(this);
		}
	}
}

//cf, a, b, c, d, found_, index_, initial_matrix_values_, top_
class SqrtCompositeCF extends CF {
	constructor(parent_cf, found_, index_, a_to_h_arr_){ ///found_, index_X, a_to_h_arr_ = optional parameters. Useful for arithmetics with FiniteCF/cloning operations.
		super();

		if(! CF.is_normalized_cf(parent_cf)) throw "SqrtCompositeCF must be initialized with a normalized cf cfX";
		if(parent_cf.constructor.name === "FiniteCF") throw "SqrtCompositeCF shouldn't be initialized with a FiniteCF parent_cf. Instead use CF.make_sqrt_of_fraction(num,den)";
		//initialize matrix   |a    b  |
		//                    |  e    f|
		//					  | 	   |
		// 					  |c    d  |
		// 					  |  g    h|
		if(a_to_h_arr_ === undefined)	[this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] = [make_fraction(0,1),make_fraction(1,1),make_fraction(0,1),make_fraction(0,1), make_fraction(0,1),make_fraction(0,1),make_fraction(1,1),make_fraction(0,1)];
		else [this.a, this.b, this.c, this.d, this.e, this.f, this.g, this.h] = a_to_h_arr_;

		this.parent_cf = parent_cf;

		if (found_ === undefined) this.found = [];
		else					  this.found = found_;

		if(index_ === undefined) this.index = 0;
		else 					 this.index = index_;

		this.precision_per_num = make_fraction(1n,6n); 
		this.starting_val_newton = make_fraction(3n,1n);
		this.just_extracted_to_found=true;
		this.top_matrix = [make_fraction(1,1),make_fraction(0,1),make_fraction(0,1),make_fraction(1,1)];
	}

	clone() {
		return new SqrtCompositeCF(
				this.parent_cf,
				this.found.map((x)=>x.clone()),
				this.index,
				[this.a, this.b, this.c, this.d, this.e, this.f , this.g, this.h].map((x)=>x.clone())
			);
	}
	to_decimal_string(decimal_precision){
		let decimal_precision_as_fraction = make_fraction(1n,10n**BigInt(decimal_precision + 1));
		// let [a,b,c,d] = [make_fraction(1,1),make_fraction(0,1),make_fraction(0,1),make_fraction(1,1)];
		// let within_precision = false;
		// let idx = 0;
		// while(! within_precision){
		// 	let elem = this.element(idx++);
		// 	[a, b] = [elem.mul(a).add(b), a];
  //           [c, d] = [elem.mul(c).add(d), c];
  //           if(c.is_non_zero() && d.is_non_zero()){
  //           	let frac1 = a.div(c);
  //           	let frac2 = b.div(d);
  //           	within_precision = frac1.dist(frac2).is_lt(decimal_precision_as_fraction);
  //           }   
		// }
		let not_close_enough = this.top_matrix[0].div(this.top_matrix[2]).dist(this.top_matrix[1].div(this.top_matrix[3])).is_gt(decimal_precision_as_fraction);
		while(not_close_enough){
			let g = this.find_next();
			if(g !== undefined)not_close_enough = this.top_matrix[0].div(this.top_matrix[2]).dist(this.top_matrix[1].div(this.top_matrix[3])).is_gt(decimal_precision_as_fraction);
		}
		let ret_frac = this.top_matrix[0].div(this.top_matrix[2]);
		ret_frac.simplify();
		if(ret_frac.num < 0n){
			ret_frac = ret_frac.sub(make_fraction(5n,10n**BigInt(decimal_precision + 1)));
		}
		else{
			ret_frac = ret_frac.add(make_fraction(5n,10n**BigInt(decimal_precision + 1)));
		}
		return ret_frac.to_decimal_string(decimal_precision);
	}

	negate() {		
		//(cf, a, b, c, d, found_, index_, initial_matrix_values_, top_)
		return CF.make_first_composite_cf(this, -1n,0n,0n,1n);
	}
	inverse() {
		return CF.make_first_composite_cf(this, 0n,1n,1n,0n);
	}
	simplify(){
		//USE IN TESTING ONLY
		let gcd_val = [this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].reduce((prev,curr) => BigInt.gcd(prev,curr)).abs();
		[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] = 
			[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=>x/gcd_val);
		let x = [this.a,this.b,this.c,this.d].find((x)=>x.is_non_zero());
		if(x===undefined)return;
		else if(x.is_lt(fr.zero)){
			[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] = 
				[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=>x.negate());
		}
	}
	element(i) {
		while (this.length() < i+1) this.find_next();
		return this.found[i];
	}
	to_text_string(){
		return `[SqrtCompositeCF. Found so far: [${this.found.map((x)=>" "+x.to_text_string())} ], X = parent_cf:${this.parent_cf.to_text_string()}, remaining computation: index in found_cf = ${this.index}, (${this.a.to_text_string()}*XY + ${this.b.to_text_string()}*X + ${this.c.to_text_string()}*Y + ${this.d.to_text_string()}) / (${this.e.to_text_string()}*XY + ${this.f.to_text_string()}*X + ${this.g.to_text_string()}*Y + ${this.h.to_text_string()})]`;
	}
	to_text_string2(){
		return `[Sqrt. Found so far: [${this.found.map((x)=>" "+x.to_text_string2())} ], X = parent_cf:${this.parent_cf.to_text_string2()}, remaining computation: index in found_cf = ${this.index}, (${this.a.to_text_string2()}*XY + ${this.b.to_text_string2()}*X + ${this.c.to_text_string2()}*Y + ${this.d.to_text_string2()}) / (${this.e.to_text_string2()}*XY + ${this.f.to_text_string2()}*X + ${this.g.to_text_string2()}*Y + ${this.h.to_text_string2()})]`;
	}

	is_fully_known_upon_construction(){
		return false;
	}
	find_next() {
		//not guarenteed to find the next number! Performs a single algorithmic step.
		//first, if we don't have parent_cf[index_X], find it, then do the same for cfY[index_Y]:
		while( ! (this.index < this.parent_cf.length() + 1)){
			this.parent_cf.find_next();
		}
		if(this.index %3 === 0){
		[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=>x.simplify());
		}

		//after a number is extracted, at least one left step must be taken!
		if(!this.just_extracted_to_found){


		// next, try to extract a number:
		let third = make_fraction(1n,3n);
		let tenth = make_fraction(1n,10n);
		if((this.g.is_non_zero() || this.h.is_non_zero()) && (this.e.is_non_zero() || this.f.is_non_zero())){		
			// let [simple_a, simple_b, simple_c, simple_d, simple_e, simple_f, simple_g, simple_h] = [this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=> fraction_simplifier(x,15));
			// let f1 = (y) => (y.mul(simple_c).add(simple_d)).div(y.mul(simple_g).add(simple_h));
			// let f2 = (y) => (y.mul(simple_a).add(simple_b)).div(y.mul(simple_e).add(simple_f));
			let f1 = (y) => (y.mul(this.c).add(this.d)).div(y.mul(this.g).add(this.h));
			let f2 = (y) => (y.mul(this.a).add(this.b)).div(y.mul(this.e).add(this.f));
			let guess1 = this.starting_val_newton;
			while(guess1.mul(this.g).add(this.h).is_zero() || guess1.mul(this.e).add(this.f).is_zero()){
				guess1 = guess1.add(make_fraction(1,1));
			}

			let found_fixed1 = false;
			while(! found_fixed1) {
				// guess1 = fraction_simplifier(guess1,7);//TODO: RETURN?
				let f1_guess = f1(guess1);

				if(f1_guess.den === 0n || (!guess1.is_positive() && !f1_guess.is_positive())) {
					this.starting_val_newton = this.starting_val_newton.mul(make_fraction(4,1));
					return this.find_next();
				}
				else{
					guess1 = fr.Fraction.average([guess1,f1_guess]);
					if(guess1.trunc_to_BigInt() === f1_guess.trunc_to_BigInt() || guess1.dist(f1_guess).is_lt(tenth)){
						if(guess1.is_positive()){
							found_fixed1 = true;
						} 
						else {
							this.starting_val_newton = this.starting_val_newton.mul(make_fraction(4,1));
							return this.find_next();
						}
					}
					
				}
			}
			guess1.simplify();
			if(guess1.den !== 0n){
				let f2_guess = f2(guess1);
				if(f2.den !== 0n){
					//if the distance between f2_guess & guess1 is small 
					//then we've found an extractable number!
					let xx = (guess1.trunc_to_BigInt() === f2_guess.trunc_to_BigInt())&& (guess1.trunc_to_BigInt() === f1(guess1).trunc_to_BigInt());
					if(xx || guess1.dist(f2_guess).is_lt(third)){
						[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=>x.simplify());
						if(xx){
							guess1 = guess1.trunc();
						}
						else{
							guess1 = fraction_simplifier(fr.Fraction.min([guess1,f1(guess1),f2(guess1)]), 4);
						}						
						guess1.simplify();
						this.found.push(guess1);
						let new_a = guess1.mul(this.e).add(this.f);
						let new_b = this.e;
						let new_c = guess1.mul(this.g).add(this.h);
						let new_d = this.g;
						let new_e = guess1.mul(this.a.sub(guess1.mul(this.e))).add(this.b.sub(guess1.mul(this.f)));
						let new_f = this.a.sub(guess1.mul(this.e));
						let new_g = guess1.mul(this.c.sub(guess1.mul(this.g))).add(this.d.sub(guess1.mul(this.h)));
						let new_h = this.c.sub(guess1.mul(this.g));
						[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] = 
							[new_a,new_b,new_c,new_d,new_e,new_f,new_g,new_h];
						[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h].map((x)=>x.simplify());
						this.just_extracted_to_found = true;
						this.top_matrix= mat_mul(this.top_matrix, [guess1, make_fraction(1,1),make_fraction(1,1),make_fraction(0,1)]);
						return guess1;
					}
				}
			}
		}
		}
		//if we've successfully extracted a number, we will return before this line of code.
		//thus we haven't successfully extracted a number - so move left!
		let elem = this.parent_cf.element(this.index);
		let new_a = this.a.mul(elem).add(this.c);
		let new_b = this.b.mul(elem).add(this.d);
		let new_e = this.e.mul(elem).add(this.g);
		let new_f = this.f.mul(elem).add(this.h);
		[this.a,this.b,this.c,this.d,this.e,this.f,this.g,this.h] =
			[new_a,new_b,this.a,this.b,new_e,new_f,this.e,this.f];
		this.index++;
		this.starting_val_newton = make_fraction(12n,1n);//in case it was previously modified
		this.just_extracted_to_found = false; //having now moved left, we've clearly not just extracted a number into this.found
		return;
	}
	find_n_elements(n){
		while((this.found.length < n))	this.find_next();
	}

}


class GeneralizedCF extends CF {
//
// Note: no detection of cycles.
//
//    Arithmetics with Finite CFs should be handled by constructing the appropriate FirstCompositeCF in add/mul/div/sub. 
//	

	constructor(a, b, c, d, f_num, f_den){ //f_num & f_den are indexed functions that return Fraction objects, while a,b,c,d are, as usual, big ints.
		super();
		//initialize matrix   |a b|
		//                    |c d| 
		[this.a, this.b, this.c, this.d] = [BigInt(a), BigInt(b), BigInt(c), BigInt(d)];
		this.f_num = f_num;
		this.f_den = f_den;
		[this.top_a, this.top_b, this.top_c, this.top_d] = [this.a,this.b,this.c,this.d]; // used for to_decimal_string(decimal_precision)
		this.initial_matrix_values = [this.a, this.b, this.c, this.d];
		this.found = [];// an array of Fraction Objects.
		this.index = 0;
	}

	clone() {
		let x = new GeneralizedCF(this.a, this.b, this.c, this.d, this.f_num, this.f_den);
		x.found = [...this.found]; 
		x.index = this.index;
		[x.top_a, x.top_b, x.top_c, x.top_d] = [this.top_a, this.top_b, this.top_c, this.top_d];
		x.initial_matrix_values = [...this.initial_matrix_values];
		return x;
	}

	to_decimal_string(decimal_precision){
		let decimal_precision_as_fraction = make_fraction(1n,10n**BigInt(decimal_precision + 1));
		let frac_a_c;
		let frac_b_d;

		let within_precision;
		if(this.top_c !== 0n && this.top_d !== 0n){
			frac_a_c = make_fraction(this.top_a,this.top_c);
			frac_b_d = make_fraction(this.top_b,this.top_d);
			within_precision = frac_a_c.dist(frac_b_d).is_lt(decimal_precision_as_fraction);
		}
		else within_precision = false; // why not just set within_precision to false in all cases? Because then we'd execute this.find_next() automatically, even if unnecessary.
		while(! within_precision){
			this.find_next();
			if(this.top_c !== 0n && this.top_d !== 0n){
				frac_a_c = make_fraction(this.top_a,this.top_c);
				frac_b_d = make_fraction(this.top_b,this.top_d);
				within_precision = frac_a_c.dist(frac_b_d).is_lt(decimal_precision_as_fraction);
			}
		}
		let ret_frac = make_fraction(this.top_a,this.top_c);
		if(ret_frac.num < 0n){
			ret_frac = ret_frac.sub(make_fraction(5n,10n**BigInt(decimal_precision + 1)));
		}
		else{
			ret_frac = ret_frac.add(make_fraction(5n,10n**BigInt(decimal_precision + 1)));
		}
		return ret_frac.to_decimal_string(decimal_precision);
	}
	negate() {
		return new GeneralizedCF(-this.initial_matrix_values[0], -this.initial_matrix_values[1], 
								  this.initial_matrix_values[2], this.initial_matrix_values[3], 
								  this.f_num, this.f_den);
	}
	inverse() {
		return new GeneralizedCF(this.initial_matrix_values[2], this.initial_matrix_values[3], 
								  this.initial_matrix_values[0], this.initial_matrix_values[1], 
								  this.f_num, this.f_den);
	}
	simplify(){
		//USE IN TESTING ONLY
		let gcd_val = BigInt.abs(BigInt.gcd(BigInt.gcd(this.a,this.b), BigInt.gcd(this.c,this.d)));
		[this.a,this.b,this.c,this.d] = [this.a/gcd_val, this.b/gcd_val, this.c/gcd_val, this.d/gcd_val];
		if(this.a<0n){
			[this.a,this.b,this.c,this.d] = [-this.a,-this.b,-this.c,-this.d];
		}
		else if(this.a === 0n && this.b < 0n){
			[this.a,this.b,this.c,this.d] = [-this.a,-this.b,-this.c,-this.d];
		}
	}
	element(i) {
		while (this.length() < i+1) this.find_next();
		return this.found[i];
	}
	to_text_string(){
		return `[GeneralizedCF. Found so far: [${this.found}], stream of numerators = ${this.f_num}, stream of denominators = ${this.f_den}, remaining computation: index = ${this.index}, (${this.a}*X + ${this.b}) / (${this.c}*X + ${this.d})]`;
	}
	to_text_string2(){
		return `[Found: [${this.found.map((x)=>" "+ BigInt.toFloatString(x.to_text_string()))} ], stream nums = ${this.f_num}, stream dens = ${this.f_den}, index = ${this.index}, (${BigInt.toFloatString(this.a)}*X + ${BigInt.toFloatString(this.b)}) / (${BigInt.toFloatString(this.c)}*X + ${BigInt.toFloatString(this.d)})]`;
	}
	is_fully_known_upon_construction(){
		return false;
	}
	find_next(){
		//not guarenteed to find the next number! Performs a single algorithmic step.

		if(this.index % 6 === 0){
			let gcd = BigInt.gcd(BigInt.gcd(this.a, this.b), BigInt.gcd(this.c, this.d));
			gcd = BigInt.abs(gcd);
			[this.a, this.b, this.c, this.d] = [this.a/gcd, this.b/gcd, this.c/gcd, this.d/gcd];

			let gcd2 = BigInt.gcd(BigInt.gcd(this.top_a, this.top_b), BigInt.gcd(this.top_c, this.top_d));
			gcd2 = BigInt.abs(gcd2);
			[this.top_a, this.top_b, this.top_c, this.top_d] = [this.top_a/gcd2, this.top_b/gcd2, this.top_c/gcd2, this.top_d/gcd2];
		}

		if((this.c !== 0n && this.d !== 0n) && (this.a/this.c === this.b/this.d)) {
			// Extract!
			let newly_found_val = this.a/this.c;
			let new_a_row = this.c;
			let new_b_row = this.d;
			let new_c_row = this.a - this.c * newly_found_val;
			let new_d_row = this.b - this.d * newly_found_val;
			this.a = new_a_row;
			this.b = new_b_row;
			this.c = new_c_row;
			this.d = new_d_row;

			let to_push = make_fraction(newly_found_val,1n);
			this.found.push(to_push);
			return to_push;
		}
		/* Left Step
		the math:
		
		Using Gosper a step left should be the transformation
		[a b] -> [a*den + b*num   a]
		[c d] -> [c*den + d*num   c]
		However, it is possible (and likely) that num & den will be fractions rather than integers,
		so we write
			den = alpha/beta
			num = gamma/delta
		and then we have
			[a*den + b*num   a] = [a*(alpha/beta)+b*(gamma/delta)   a]
			[c*den + d*num   c] = [c*(alpha/beta)+d*(gamma/delta)   c]
		and by multiplying both numerator and denominator by (beta*delta) we arrive at 
			[a*(alpha/beta)+b*(gamma/delta)   a] -> [a*alpha*delta + b*beta*gamma    a*beta*delta]
			[c*(alpha/beta)+d*(gamma/delta)   c] -> [c*alpha*delta + d*beta*gamma    c*beta*delta]
		and that is our step left
		*/
		let fr1 = this.f_num(this.index - 1); //we'll designate this as gamma/delta
		let fr2 = this.f_den(this.index);     //we'll designate this as alpha/beta

		const [alpha,beta,gamma,delta] = [fr2.num,fr2.den,fr1.num,fr1.den];

		let new_a_column = this.a * alpha * delta + this.b * beta * gamma;
		let new_b_column = beta * delta * this.a;
		let new_c_column = this.c * alpha * delta + this.d * beta * gamma;
		let new_d_column = beta * delta * this.c;
		let new_top_a = this.top_a * alpha * delta + this.top_b * beta * gamma;
		let new_top_b = beta * delta * this.top_a;
		let new_top_c = this.top_c * alpha * delta + this.top_d * beta * gamma;
		let new_top_d = beta * delta * this.top_c;

		[this.a, this.b, this.c, this.d] = [new_a_column, new_b_column, new_c_column, new_d_column];
		[this.top_a, this.top_b, this.top_c, this.top_d] = [new_top_a, new_top_b, new_top_c, new_top_d];
		this.index++ ;
		return;
	}
	find_n_elements(n){
		while((this.found.length < n))	this.find_next();
	}
}


class Constants{
	static toString(){
		return `static e(), returns the constant e = 2.718...
static e_sqrd(), returns the constant e^2 = 7.389...
static pi(), returns the constant pi = 3.14159...
static golden_ratio(), returns the constant 1.618...
static e_1_n(n), e^(1/n) for a positive integer n.
static e_2_n(n), e^(2/n) for a positive odd integer n.
static tan1(), tan(1).
static tan_1_n(n), tan(1/n) for a positive integer n.
static tanh_1_n(n), tanh(1/n) for a positive integer n.
static e_x(x), e^x for a Fraction object or an integer x. It should NOT be a floating point number.
static ln_1_plus_x(x), ln(1+x) for a Fraction x s.t. |x|<1 .
static arctan(x), for a Fraction object or an integer x. It should NOT be a floating point number.
static sin(x), for a Fraction object or an integer x. It should NOT be a floating point number.
static cos(x), for a Fraction object or an integer x. It should NOT be a floating point number.
static arcsin(x), for a Fraction object or an integer x. It should NOT be a floating point number.
static sinh(x), for a Fraction object or an integer x. It should NOT be a floating point number.
static cosh(x), for a Fraction object or an integer x. It should NOT be a floating point number.`;
	}

	static e(){
		let formula_e = (n) => (n===0) ? 2n : (n%3 !== 2) ? 1n : BigInt((2*n+2)/3);
		let out = CF.make_cf_from_method(formula_e);
		out.sqrt = () => Constants.e_1_n(2n);
		return out;
	}
	static e_sqrd(){
		let formula_e_squared = (n) => (n===0) ? 7n : (n%5 === 2 || n%5 === 3) ? 1n : (n%5 === 4) ? BigInt((3*n+3)/(5)) : (n%5 === 0) ? BigInt((12*n+30)/(5)) : BigInt((3*n+7)/(5));
		let out =  CF.make_cf_from_method(formula_e_squared);
		out.sqrt = () => Constants.e();
		return out;
	}
	static golden_ratio(){
		return CF.make_cf_from_repeating_pattern([],[1n]);
	}
	
	// e^(1/n) for a positive integer n:
	static e_1_n(n){
		n = BigInt(n);
		if(n < 1n) throw "n must be positive";
		let f = (x) => x%3 === 1 ? (1n + (2n*BigInt(x)/3n))*n - 1n : 1n;
		let out = CF.make_cf_from_method(f);
		out.sqrt = () => Constants.e_1_n(2n*n);
		return out;
	}
	// e^(2/n) for a positive odd integer n:
	static e_2_n(n){
		n = BigInt(n);
		if(n < 1n) throw "n must be a positive integer";
		if(n%2n === 0n) throw "n must be odd";
		// (1  +  (2/3)*x)*n - 1
		let f = (x)=>{
			if(x%5 === 0 || x%5 === 4){
				return 1n;
			}
			else if(x%5 === 1){
				return ((6n*(BigInt(x)/5n)+1n)*n - 1n)/2n;
			}
			else if(x%5 === 2){
				return (6n + 12n*(BigInt(x)/5n))*n;
			}
			else{//x%5===3
				return ((5n +  6n*(BigInt(x)/5n))*n -1n)/2n;
			}
		}
		let out =  CF.make_cf_from_method(f);
		out.sqrt = () => Constants.e_1_n(n);
		return out;
	}
	// tan(1)
	static tan1(){
		let f = (x) => x%2 === 1 ? BigInt(x) : 1n;
		return CF.make_cf_from_method(f);
	}
	// tan(1/n)
	static tan_1_n(n){
		n = BigInt(n);
		if(n < 1n) throw "n must be a positive integer";
		if(n===1n) return Constants.tan1();
		let f = (x) => {
			if(x<2){
				if(x===0)return 0n;
				return n -1n;
			}
			else if(x%2 === 0){
				return 1n;
			}
			else{
				return n*BigInt(x) - 2n;
			}
		}
		return CF.make_cf_from_method(f);
	}
	static tanh_1_n(n){
		n = BigInt(n);
		if(n < 1n) throw "n must be a positive integer";
		let f = (x) => {
			if(x === 0){
				return 0n;
			}
			else{
				return (2n*BigInt(x) - 1n)*n;
			}
		}
		return CF.make_cf_from_method(f);
	}


	//GeneralizedCF Identities:
	static pi(){
		// converges linearly - adds at least three digits of percision per four terms.
		let f_num = (idx) => {
			if(idx < 1) {
				if     (idx === -1) {return make_fraction(1n,1n);}
				else if(idx ===  0) {return make_fraction(4n,1n);}
			}
			else {
				return make_fraction(BigInt(idx*idx),1n);
			}
		}
		let f_den = (idx) => {
			if(idx === 0) {return make_fraction(0n,1n);}
			else          {return make_fraction(idx*2 -1 ,1n);}
		}
		return new GeneralizedCF(1n,0n,0n,1n,f_num,f_den);
	}
	static e_x(x){ 	// e^x
					// parameter x should be either a Fraction object or an integer.
					// it should NOT be a floating point number.
		if(x.constructor.name === "BigInt" || x.constructor.name === "Number"){
			x = make_fraction(x,1n);
		} 
		x = x.clone();
		let f_num = (idx) => {
			if(idx < 2){
				if(idx === -1 || idx === 0) {return make_fraction(1n,1n);}
				else {return x.negate()}
			}
			else{
				return x.mul(make_fraction(1-idx,1n));
			}
		}
		let f_den = (idx) => {
			if(idx < 2) {
				if(idx === 0) {return make_fraction(0n,1n);}
				else 		  {return make_fraction(1n,1n);}
			}
			else {
				return x.add(make_fraction(idx-1,1n));
			}
		}
		return new GeneralizedCF(1n,0n,0n,1n,f_num,f_den);
	}
	static ln_1_plus_x(x){ // ln(1+x). x must be a Fraction s.t. |x|<1
		if(x.constructor.name !== "Fraction") throw 'the method ln_1_plus_x must be initialized with a fraction object';
		if(x.abs().is_ge(make_fraction(1n,1n))) throw "the method ln_1_plus_x(x) must be initialized with |x|<1";
		if(x.is_zero()) return cf.CF.make_cf_from_fraction(0n,1n);
		x = x.clone();
		let f_num = (idx) => {
			if(idx < 1){
				if(idx === -1) {return make_fraction(1n,1n);}
				else return x;
			}
			else{
				return x.mul(make_fraction(idx*idx, 1n));
			}
		}
		let f_den = (idx) => {
			if(idx < 2){
				if(idx === 0) {return make_fraction(0n,1n);}
				else          {return make_fraction(1n,1n);}
			}
			else{
				return x.mul(make_fraction(1-idx,1n)).add(make_fraction(idx,1n));
			}
		}
		return new GeneralizedCF(1n,0n,0n,1n,f_num,f_den);
	}
	static arctan(x){ 	
				// parameter x should be either a Fraction object or an integer.
				// it should NOT be a floating point number.
		if(x.constructor.name === "BigInt" || x.constructor.name === "Number"){
			x = make_fraction(x,1n);
		}
		x = x.clone();
		let x_sqrd = x.mul(x);
		let f_num = (idx) => {
			if(idx<1){
				if(idx === -1) {return make_fraction(1n,1n);}
				else {return x}
			}
			else{
				return x_sqrd.mul(make_fraction(idx*idx,1n));
			}
		}
		let f_den = (idx) => {
			if(idx === 0) {return make_fraction(0n,1n);}
			else          {return make_fraction(2*idx-1,1n);}
		}
		return new GeneralizedCF(1n,0n,0n,1n,f_num,f_den);
	}
	static sin(x){
				// parameter x should be either a Fraction object or an integer.
				// it should NOT be a floating point number.

		if(x===0n || x===0 || (x.constructor.name === "Fraction" && x.is_zero())){
			return CF.make_cf_from_fraction(0n,1n);
		}
		if(x.constructor.name === "BigInt" || x.constructor.name === "Number"){
			x = make_fraction(x,1n);
		}
		x = x.clone();
		let x_sqrd = x.mul(x);

		let f_num = (idx) => {
			if(idx<2){
				if(idx === -1) {return make_fraction(1n,1n);}
				else if(idx === 0){return x;}
				else {return x_sqrd;}
			}
			else {
				return make_fraction((2*idx-1)*(2*idx-2),1n).mul(x_sqrd);
			}
		}
		let f_den = (idx) => {
			if(idx <2) 	  {
				if(idx===0) {return make_fraction(0n,1n);}
				else        {return make_fraction(1n,1n)}
			}
			else {
				return make_fraction((2*idx-1)*(2*idx-2), 1n).sub(x_sqrd);
			}
		}
		return new GeneralizedCF(1n,0n,0n,1n,f_num,f_den);
	}
	static cos(x){
				// parameter x should be either a Fraction object or an integer.
				// it should NOT be a floating point number.

		if(x===0n || x===0 || (x.constructor.name === "Fraction" && x.is_zero())){
			return CF.make_cf_from_fraction(1n,1n);
		}
		if(x.constructor.name === "BigInt" || x.constructor.name === "Number"){
			x = make_fraction(x,1n);
		}
		x = x.clone();
		let x_sqrd = x.mul(x);

		let f_num = (idx) => {
			if(idx<2){
				if(idx === -1 || idx === 0) {return make_fraction(1n,1n);}
				else {return x_sqrd;}
			}
			else {
				return make_fraction((2*idx-3)*(2*idx-2),1n).mul(x_sqrd);
			}
		}
		let f_den = (idx) => {
			if(idx <2) 	  {
				if(idx===0) {return make_fraction(0n,1n);}
				else        {return make_fraction(1n,1n)}
			}
			else {
				return make_fraction((2*idx-3)*(2*idx-2), 1n).sub(x_sqrd);
			}
		}
		return new GeneralizedCF(1n,0n,0n,1n,f_num,f_den);
	}

	static arcsin(x){
				// parameter x should be either a Fraction object or an integer.
				// it should NOT be a floating point number.

		if(x===0n || x===0 || (x.constructor.name === "Fraction" && x.is_zero())){
			return CF.make_cf_from_fraction(0n,1n);
		}
		if(x.constructor.name === "BigInt" || x.constructor.name === "Number"){
			x = make_fraction(x,1n);
		}
		x = x.clone();
		let x_sqrd = x.mul(x);

		let f_num = (idx) => {
			if(idx<2){
				if(idx === -1) {return make_fraction(1n,1n);}
				else if(idx === 0){return x;}
				else {return x_sqrd.negate();}
			}
			else {
				return make_fraction((2*idx-1)*(2*idx-1)*(2*idx-1)*(2*idx-2),1n).mul(x_sqrd).negate();
			}
		}
		let f_den = (idx) => {
			if(idx <2) 	  {
				if(idx===0) {return make_fraction(0n,1n);}
				else        {return make_fraction(1n,1n)}
			}
			else {
				let tmp = make_fraction(2*idx-3,1n);
				return make_fraction((2*idx-1)*(2*idx-2), 1n).add(x_sqrd.mul(tmp).mul(tmp));
			}
		}
		return new GeneralizedCF(1n,0n,0n,1n,f_num,f_den);
	}
	// static arccos(x){

	// }
	static sinh(x){
				// parameter x should be either a Fraction object or an integer.
				// it should NOT be a floating point number.

		if(x===0n || x===0 || (x.constructor.name === "Fraction" && x.is_zero())){
			return CF.make_cf_from_fraction(0n,1n);
		}
		if(x.constructor.name === "BigInt" || x.constructor.name === "Number"){
			x = make_fraction(x,1n);
		}
		x = x.clone();
		let x_sqrd = x.mul(x);

		let f_num = (idx) => {
			if(idx<2){
				if(idx === -1) {return make_fraction(1n,1n);}
				else if(idx === 0){return x;}
				else {return x_sqrd.negate();}
			}
			else {
				return make_fraction((2*idx-1)*(2*idx-2),1n).mul(x_sqrd).negate();
			}
		}
		let f_den = (idx) => {
			if(idx <2) 	  {
				if(idx===0) {return make_fraction(0n,1n);}
				else        {return make_fraction(1n,1n)}
			}
			else {
				return make_fraction((2*idx-1)*(2*idx-2), 1n).add(x_sqrd);
			}
		}
		return new GeneralizedCF(1n,0n,0n,1n,f_num,f_den);
	}
	static cosh(x){
				// parameter x should be either a Fraction object or an integer.
				// it should NOT be a floating point number.

		// if(x===0n || x===0 || (x.constructor.name === "Fraction" && x.is_zero())){
		// 	return CF.make_cf_from_fraction(1n,1n);
		// }
		if(x.constructor.name === "BigInt" || x.constructor.name === "Number"){
			x = make_fraction(x,1n);
		}
		x = x.clone();
		let x_sqrd = x.mul(x);

		let f_num = (idx) => {
			if(idx<2){
				if(idx === -1 || idx === 0) {return make_fraction(1n,1n);}
				else {return x_sqrd.negate();}
			}
			else {
				return make_fraction((2*idx-3)*(2*idx-2),1n).mul(x_sqrd).negate();
			}
		}
		let f_den = (idx) => {
			if(idx <2) 	  {
				if(idx===0) {return make_fraction(0n,1n);}
				else        {return make_fraction(1n,1n)}
			}
			else {
				return make_fraction((2*idx-3)*(2*idx-2), 1n).add(x_sqrd);
			}
		}
		return new GeneralizedCF(1n,0n,0n,1n,f_num,f_den);
	}
}

module.exports = {
	CF, Constants
}
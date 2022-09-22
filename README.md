![](https://raw.githubusercontent.com/amitrubin/R-Arithmetic/main/R%20Arithmetic%20Logo2.png)

This JavaScript library provides Arbitrarily Precise Calculations over real computable numbers.  

E.g. give me the first 100 decimal digits of 3*e/pi: '2.5957679382967952616533243689382688522862338717255466183629908668441351337120311758957739875485535519'  

## Table of contents

[How to set up the library](https://github.com/amitrubin/R-Arithmetic/blob/main/README.md#how-to-set-up-the-library)

[The Basics (Structure and Theory)](https://github.com/amitrubin/R-Arithmetic/blob/main/README.md#the-basics-structure-and-theory)

[Guide](https://github.com/amitrubin/R-Arithmetic/blob/main/README.md#guide)

- [Example code 1: getting an approximation](https://github.com/amitrubin/R-Arithmetic/blob/main/README.md#example-code-1-getting-an-approximation)

- [Example code 2: Arithmetic](https://github.com/amitrubin/R-Arithmetic/blob/main/README.md#example-code-2-arithmetic)

- [Other important operations](https://github.com/amitrubin/R-Arithmetic/blob/main/README.md#other-important-operations)

- [Efficient arithmetic](https://github.com/amitrubin/R-Arithmetic/blob/main/README.md#efficient-arithmetic)

- [Full Documentation](https://github.com/amitrubin/R-Arithmetic/blob/main/README.md#full-documentation)

## How to set up the library

Simply download the two files (*fractions.js*, *continued_fractions.js*). Make sure you put them in the same directory.

## The Basics (Structure and Theory)

The calculator is made up of two components. 

The first is a straight-forward fractions (rational numbers) calculator. It is implemented in the file *fractions.js*  

However, in this project I sought (under the guidance of professor Mayer Goldberg) to to include irrational numbers such as the square root of two, pi, cosh(1.234567), etc. Importantly, the results should always be as precisely accurate as we desire.

For this purpose we utilized infinite [Continued Fractions](https://en.wikipedia.org/wiki/Continued_fraction) as foundation. There is good reason to do so: continued fractions have great convergence properties, and many irrational numbers have known continued fraction identities. These are implemented in *continued_fractions.js*  

However, we're still missing a crucial component - precise arithmetic between the irrationals, and between irrationals and rationals! For this I utilized [Bill Gosper's 1972 algorithms](https://perl.plover.com/yak/cftalk/INFO/gosper.txt), though with a great deal of modifications. This arithmetic is also included in *continued_fractions.js*

## Guide

### Example code 1: getting an approximation.

Let's find the first 100 digits of pi & of arctan(0.9):  

    let cf = require("./continued_fractions.js");  
    let fr = require("./fractions.js");  

    let a = cf.Constants.pi(); // the constant pi, i.e. 3.14159...  

    let ninth = fr.Fraction.make_fraction_from_string("9/10"); // you could also write fr.Fraction.make_fraction_from_bignums(9n,10n);  
    let b = cf.Constants.arctan(ninth);

    let str1 = a.to_decimal_string(100);    
    let str2 = b.to_decimal_string(100);  
    console.log("pi: " + str1);  
    console.log("arctan(0.9): " + str2);  

Now let's break that down:
 
#### *Importing the library*

Step one is importing *continued_fractions.js* and *fractions.js*.  

    let cf = require("./continued_fractions.js");  
    let fr = require("./fractions.js");  

Next, we need two classes from cf. 

There are the irrational constants: `cf.Constants;`  
and there are factory methods for the rest: `cf.CF;`  

(there is currently some overlap between the two classes. This will be corrected soon - if this notice is still around in 2023 please nudge me to fix it)

#### *Constants*

The Constants class has factory methods that return new copies of mathematical constants. A full list of available methods is available by running console.log(cf.Constants.toString()).  

Here are two examples, with and without parameters. First, pi:

    let a = cf.Constants.pi(); // the constant pi, i.e. 3.14159...

Easy enough. But what if we require a parameter, i.e. arctan(0.9)? Since we don't wish to use JavaScript's imprecise Number for 0.9, we will instead first use fractions.js to precisely represent 0.9, then apply arctan:

    let ninth = fr.Fraction.make_fraction_from_string(`9/10`);  
    let b = cf.Constants.arctan(ninth);  

#### *Results!*

The `.to_decimal_string(precision-number-parameter)` operation does two things:

 1. Calculates the required precision.  
 2. Returns it as a string.

The calculation is encapsulated within the number object, and is retained there. Thus, once you've called it once for a given precision, future calls with the same/less precision should be rather quick.

OK, let's put this to practice: 

    let str1 = a.to_decimal_string(100);    
    let str2 = b.to_decimal_string(100);  
    console.log("pi: " + str1);  
    console.log("arctan(0.9): " + str2);  
    
### Example code 2: Arithmetic

    let cf = require("./continued_fractions.js");  
    let fr = require("./fractions.js");  

    let e = cf.Constants.e(); // the constant e, i.e. 2.7182...  
    let two_thirds = cf.CF.make_cf_from_fraction(2n,3n); //wait, what? read on...  
    
    // Addition: e + (2/3)  
    let x1 = e.add(two_thirds);  
    console.log(`e + (2/3): ` + x1.to_decimal_string(100));  

    // Subtraction: e - (2/3)  
    let x2 = e.sub(two_thirds);  
    console.log(`e - (2/3): ` + x2.to_decimal_string(100));  

    // Division: e / (2/3), i.e. 3e/2  
    let x3 = e.div(two_thirds);  
    console.log(`e / (2/3): ` + x3.to_decimal_string(100));  

    // Multiplication: e * (2/3)  
    let x4 = e.mul(two_thirds);  
    console.log(`e * (2/3): ` + x4.to_decimal_string(100));  

    // Inverse: 1/e  
    let x5 = e.inverse();  
    console.log(`1/e: ` + x5.to_decimal_string(100));  
    
    // Square Root: sqrt(e)  
    let x6 = e.sqrt();  
    console.log(`sqrt(e): ` + x6.to_decimal_string(100));  
    
Now let's break that down:
 
#### *Two kinds of rationals? Yes, sorry...*

So... there are two kinds of rational number representations, as you might have noticed. The first, from *fractions.js*, should be used for only one purpose by you the user - as input for initializing constants from common functions, as we saw in **Example code 1**.  

The second is a rational number in the sense of a manipulable number with which we can perform arithmetic/print, as we see in this example for the variable two_thirds. For such purposes we initialize number-objects using cf.CF.make_cf_from_fraction(numerator, decominator);  

#### *The basic operations*

Other than the list above, the only arithmetics operation not mentioned is negate, i.e. multiplying by -1. It is currently unclear whether negative numbers always operate correctly, but feel free to test it if you so desire, for example -1*e: `let minus_e = e.negate(); console.log(minus_e.to_decimal_string(100));`  

Given two number-objects, a and b, we can initialize a result number-object c as follows:  
Addition: `let c = a.add(b);`  
Subtraction: `let c = a.sub(b);`  
Division:  `let c = a.div(b);`  
Multiplication:  `let c = a.mul(b);`  
Multiplicative Inverse:  `let c = a.inverse();`  
Square Root:  `let c = a.sqrt();`  

### Other important operations  

Although it makes no sense to me why you would do so, if you desire for the result to be a normal JavaScript Number, use `.to_float(decimal_precision)`. decimal_precision should be an integer.  

Given a number-objects you can deep-copy it by performing `.clone()`. Note that cloning means that computation done in one instance will not transfer to the other.  

To see a summary of the internal state of the calculation in a number-object, there are two-methods:  
`.to_text_string()`, recommended for deep analysis, which returns a full string description of the CF. Careful: Since we're dealing with very large BigInt's, it can get very big very quickly.  
`.to_text_string2()`, recommended for casual analysis, which returns a smaller string description of the CF. Note: unlike to_text_string, the description is imprecise.  

`.convergents(n, debug_if_this_is_slow_optional_argument)`, returns a series of fraction (from fr.Fractions) approximations ("convergents") by utilyzing the structure of a continued fraction.  

For a full list of operations run for either class the `.toString()` operation, i.e.  

    console.log(cf.CF.toString());  
    console.log(cf.Constants.toString());  

### Efficient arithmetic

The more "compound" a number-object is, that is to say - the more arithmetic operations were used in initializing it, the more difficult it will be to calculate new digits. Thus, while finding the first 15,000 digits of the constant e should take no more than 20 seconds, finding even the first 100 digits of pi*pi + 3pi takes forever (long enough that I didn't bother to let it run its course), assuming we construct it as we've seen so far:  

    let pi = cf.Constants.pi();  
    let c = pi.mul(pi).add( pi.mul(cf.CF.make_cf_from_fraction(3,1)) );  
    console.log(c.to_decimal_string(100));  
    // a further note on efficiency - note that defining pi only once means that precision 
    // calculated for a single instance of pi in the calculation is shared with all 3 appearances 
    // of pi in the above calculation. This bahavior is very desirable, and should be followed 
    // wherver possible.

There is a second reason why pi*pi + 3pi took so long: certain calculations take longer than others. In particular, any constant or trigonometric function based on an algebraic identity as a [Generalized Continued Fraction](https://en.wikipedia.org/wiki/Generalized_continued_fraction#Examples) is slower to converge, and that includes pi.  

So how about improving by a little bit (or a huge amount actually)?  

Given two number-objects `a` & `b`, and given 8 integers α,...,θ, if we wish to find  

![](https://raw.githubusercontent.com/amitrubin/R-Arithmetic/main/second%20composite%20cf2.png)
    
the most efficient way to do so is to initialize the result object "c" as follows:  

    let c = cf.CF.make_second_composite_cf(a,b, α,β,γ,δ, ε,ζ,η,θ);  

In fact, in general but not always, I implemented the four basic arithmetic operations (* + - /) using the same algorithm as `cf.CF.make_second_composite_cf`.    
Thus, for addition, the calculator calls cf.CF.make_second_composite_cf with β=γ=θ=1, and the rest of the coefficients equal 0.  
Etc.  

Let's return to pi*pi + 3pi, and let's aim higher this time - 1000 digits:  

    let pi = cf.Constants.pi();  
    let c = cf.CF.make_second_composite_cf(pi, pi, 1, 3, 0, 0, 0 , 0, 0, 1);  
    console.log(c.to_decimal_string(100));  
    
On my machine it took around 12 seconds. Much better, right?  

Note: arithmetic operations between some number-object and a rational number object (one that is initialized using cf.CF.make_cf_from_fraction) are best performed using the previously introduced `.add, .sub, .div, .mul`, and **not** using the method make_second_composite_cf.  

Another note on time-complexity: calculating the square root of anything other than a rational number-object is very intensive. Use `.sqrt` as rarely as possible.  


### Full Documentation

#### CF

(text copied from CF.toString()):

	`COMMONLY USED FACTORY METHODS:
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
		Useful for demonstrations but computationaly expensive.`


#### Constants

(text copied from Constants.toString() - a list of factory methods):

	`static e(), returns the constant e = 2.718...
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
	static cosh(x), for a Fraction object or an integer x. It should NOT be a floating point number.`


***Amit Rubin + Mayer Goldberg, 2022***  

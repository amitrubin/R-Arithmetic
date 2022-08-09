# reals-calculator

This JavaScript library provides Arbitrarily Precise Calculations over real computable numbers.  
E.g. give me the first 100 decimal digits of 3*e/pi: '2.5957679382967952616533243689382688522862338717255466183629908668441351337120311758957739875485535519'  

## The Basics

The calculator is made up of two components. 

The first is a straight-forward fractions (rational numbers) calculator. It is implemented in the file *fractions.js*  

However, the in this project I sought (under the guidance of professor Mayer Goldberg) to to include irrational numbers such as sqrt(2), pi, cosh(1.234567), etc. Importantly, the results should always be as precisely accurate as we desire.

For this purpose we utilized infinite [Continued Fractions](https://en.wikipedia.org/wiki/Continued_fraction) as foundation. There is good reason to do so: continued fractions have great convergence properties, and many irrational numbers have known continued fraction identities. These are implemented in *continued_fractions.js*  

However, we're still missing a crucial component - precise arithmetic between the irrationals, and between irrationals and rationals! For this I utilized [Bill Gosper's 1972 algorithms](https://perl.plover.com/yak/cftalk/INFO/gosper.txt), though with a great deal of modifications. This arithmetic is also included in *continued_fractions.js*

## Guide

### Importing the library

Step one is importing *continued_fractions.js* and *fractions.js*.  
let cf = require("./continued_fractions.js");  
let fr = require("./fractions.js");  

Next, we need two classes from cf. 
There are the irrational constants: cf.Constants;  
and there are factory methods for the rest: cf.CF;  

(there is currently some overlap between the classes, as indicated below. This will be corrected soon - if this line is still around in 2023 please tell me to fix it)

### Constants

The Constants class has all-static factory methods that return new copies of mathematical constants. A full list of available methods is available in appendix 1 below, or by running console.log(cf.Constants.toString()).  
Here are two examples, with and without parameters. First, pi:

let x1 = cf.Constants.pi(); // the constant pi, i.e. 3.14159...

Easy enough. But what if we require a parameter, i.e. arctan(0.9)? Since we don't wish to use JavaScript's imprecise Number for 0.9, we will instead first use fractions.js to precisely represent 0.9, then apply arctan:

let frac_0_point_9 = fr.Fraction.make_fraction_from_bignums(9n, 10n); // don't recognize the 9n? Google BigInt.
let x2 = cf.Constants.arctan(frac_0_point_9);

### Let's get some numbers!

And number-object can be turned into its decimal reprentation by applying to it .to_decimal_string(precision);

Let's return to pi and arctan(0.9), and write out a full program that prints both out:

let cf = require("./continued_fractions.js");  
let fr = require("./fractions.js");  

let x1 = cf.Constants.pi(); // the constant pi, i.e. 3.14159...
let frac_0_point_9 = fr.Fraction.make_fraction_from_bignums(9n, 10n); // don't recognize the 9n? Google BigInt.
let x2 = cf.Constants.arctan(frac_0_point_9);

console.log(x1.to_decimal_string(100));
console.log(x2.to_decimal_string(100));

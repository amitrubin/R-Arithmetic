// pc.js
// The Parser-Combinator package, implemented in JavaScript
//
// Programmer: Mayer Goldberg, 2021

// this map works both on arrays and on strings!
function map(f, arr) {
    let result = new Array();

    for (i in arr) {
        result.push(f(arr[i]));
    }

    return result;
}

function fold_left(f, unit, arr) {
    let result = unit;

    for (i in arr) {
        result = f(result, arr[i]);
    }

    return result;
}

function fold_right(f, arr, unit) {
    let result = unit;

    for (let i = arr.length - 1; i >= 0; --i) {
        result = f(arr[i], result);
    }

    return result;
}

//

class SubclassResponsibility {
    constructor(message = '') {
        this.message = message;
    }

    toString() {
        if (this.message == '') {
            return `new SubclassResponsibility()`;
        } else {
            return `new SubclassResponsibility('${this.message}')`;
        }
    }
}

class Match {
    constructor(string, from, to, value) {
        this.string = string;
        this.from = from;
        this.to = to;
        this.value = value;
    }

    get_value() {
        return this.value;
    }

    set_value(value) {
        this.value = value;
    }

    get_from() {
        return this.from;
    }

    get_to() {
        return this.to;
    }

    get_string() {
        return this.string;
    }

    toString() {
        return `new Match(${this.get_string()}, ${this.get_from()}, ${this.get_to()}, ${this.get_value()})`;
    }
}

class NoMatch {
    constructor(string, index, parser) {
        this.string = string;
        this.index = index;
        this.parser = parser;
    }

    toString() {
        return `new NoMatch(${this.string}, ${this.index}, ${this.parser.toString()})`;
    }
}

class Parser {
    // abstract method
    match(string, index) {
        throw new SubclassResponsibility();
    }

    toString() {
        throw new SubclassResponsibility();
    }
}

class EndOfInput extends Parser {
    match(string, index) {
        if (string.length <= index) {
            return new Match(string, index, index, new Array());
        } else {
            throw new NoMatch(string, index, this);
        }
    }

    toString() {
        return 'new EndOfInput()';
    }
}

var nt_end_of_input = new EndOfInput();

class Const extends Parser {
    constructor(pred) {
        super();
        this.pred = pred;
    }

    match(string, index) {
        if ((index < string.length) && this.pred(string[index])) {
            return new Match(string, index, index + 1, string[index]);
        } else {
            throw new NoMatch(string, index, this);
        }
    }

    toString() {
        return 'new Const((ch) => ...)';
    }
}

var nt_any_char = new Const((ch) => true);

class Doc extends Parser {
    constructor(parser, documentation) {
        super();
        this.parser = parser;
        this.documentation = documentation;
    }

    match(string, index) {
        return this.parser.match(string, index);
    }

    toString() {
        return `<${this.documentation}>`;
    }
}

class Pack extends Parser {
    constructor(parser, callback) {
        super();
        this.parser = parser;
        this.callback = callback;
    }

    match(string, index) {
        let original_result = this.parser.match(string, index);
        return new Match(
            string,
            index,
            original_result.get_to(),
            this.callback(original_result.get_value())
        );
    }

    toString() {
        return `new Pack(${this.parser.toString()}, ((e) => ...))`;
    }
}

class Delayed extends Parser {
    constructor(thunk) {
        super();
        this.thunk = thunk;
    }

    match(string, index) {
        return this.thunk().match(string, index);
    }
}

class Fail extends Parser {
    match(string, index) {
        throw new NoMatch(string, index, this);
    }

    toString() {
        return 'new Fail()';
    }
}

var nt_fail = new Fail();

class Epsilon extends Parser {
    match(string, index) {
        return new Match(string, index, index, new Array());
    }

    toString() {
        return 'new Epsilon()';
    }
}

var nt_epsilon = new Epsilon();

class Caten extends Parser {
    constructor(parser_1, parser_2) {
        super();
        this.parser_1 = parser_1;
        this.parser_2 = parser_2;
    }

    match(string, index) {
        let result_1 = this.parser_1.match(string, index);
        let result_2 = this.parser_2.match(string, result_1.get_to());
        return new Match(
            string,
            index,
            result_2.get_to(),
            [result_1.get_value(), result_2.get_value()]
        );
    }

    toString() {
        return `new Caten(${this.parser_1.toString()}, ${this.parser_2.toString()})`;
    }
}

function catens(arr) {
    return fold_right(
        ((a, b) =>
                new Pack(new Caten(a, b),
                    (e) => {
                        let result = e[1];
                        result.unshift(e[0]);
                        return result;
                    }
                )
        ),
        arr,
        nt_epsilon
    );
}

class Disj extends Parser {
    constructor(parser_1, parser_2) {
        super();
        this.parser_1 = parser_1;
        this.parser_2 = parser_2;
    }

    match(string, index) {
        try {
            return this.parser_1.match(string, index);
        } catch (e) {
            return this.parser_2.match(string, index);
        }
    }

    toString() {
        return `new Disj(${this.parser_1.toString()}, ${this.parser_2.toString()})`;
    }
}

function disjs(arr) {
    return fold_left(
        ((a, b) => new Disj(a, b)),
        nt_fail,
        arr
    );
}

class Diff extends Parser {
    constructor(parser_1, parser_2) {
        super();
        this.parser_1 = parser_1;
        this.parser_2 = parser_2;
    }

    match(string, index) {
        let succeed = false;
        let result = this.parser_1.match(string, index);

        try {
            this.parser_2.match(string, index);
        } catch (e) {
            succeed = true;
        }

        if (succeed) {
            return result;
        } else {
            throw new NoMatch(string, index, this);
        }
    }

    toString() {
        return `new Diff(${this.parser_1.toString()}, ${this.parser_2.toString()})`;
    }
}

class Star extends Parser {
    constructor(parser) {
        super();
        this.parser = parser;
    }

    match(string, index) {
        let position = index;
        let value = new Array();
        let v = null;

        try {
            for (; ; position = v.get_to()) {
                v = this.parser.match(string, position);
                value.push(v.get_value());
            }
            return false; // never reached!
        } catch (e) {
            if (v == null) {
                return new Match(string, index, index, value);
            } else {
                return new Match(string, index, v.get_to(), value);
            }
        }
    }

    toString() {
        return `new Star(${this.parser.toString()})`;
    }
}

class Plus extends Parser {
    constructor(parser) {
        super();
        this.parser = parser;
        this.star_parser = new Star(parser);
    }

    match(string, index) {
        let result_first = this.parser.match(string, index);
        let result_rest = this.star_parser.match(string, result_first.get_to());
        let result = result_rest.get_value();
        result.unshift(result_first.get_value());
        return new Match(
            string,
            index,
            result_rest.get_to(),
            result
        );
    }

    toString() {
        return `new Plus(${this.parser.toString()})`;
    }
}

class Maybe extends Parser {
    constructor(parser) {
        super();
        this.parser = parser;
    }

    match(string, index) {
        try {
            let result = this.parser.match(string, index);
            return new Match(
                string,
                index,
                result.get_to(),
                [true, result.get_value()]
            );
        } catch (e) {
            return new Match(
                string,
                index,
                index,
                [false, false]
            );
        }
    }

    toString() {
        return `new Maybe(${this.parser.toString()})`;
    }
}

class Power extends Parser {
    constructor(parser, exponent) {
        super();
        let i;
        let resulting_parser = new nt_epsilon;
        for (i = 0; i < exponent; ++i) {
            resulting_parser =
                new Pack(new Caten(parser, resulting_parser),
                    ((e) => {
                        let result = e[1];
                        result.unshift(e[0]);
                        return result;
                    }));
        }

        return resulting_parser;
    }

    match(string, index) {
        return this.parser.match(string, index);
    }

    toString() {
        return `new Power(${this.parser.toString()}, ${this.exponent})`;
    }
}

class Guard extends Parser {
    constructor(parser, guard) {
        super();
        this.parser = parser;
        this.guard = guard;
    }

    match(string, index) {
        let result = this.parser.match(string, index);
        if (this.guard(result.get_value())) {
            return result;
        } else {
            throw new NoMatch(string, index, this);
        }
    }

    toString() {
        return `new Guard(${this.parser.toString()}, ((e) => ...))`;
    }
}

class FollowedBy extends Parser {
    constructor(parser_1, parser_2) {
        super();
        this.parser_1 = parser_1;
        this.parser_2 = parser_2;
    }

    match(string, index) {
        try {
            let result = this.parser_1.match(string, index);
            let _result = this.parser_2.match(string, result.get_to());
            return result;
        } catch (e) {
            throw new NoMatch(string, index, this);
        }
    }

    toString() {
        return `new FollowedBy(${this.parser_1.toString()}, ${this.parser_2.toString()})`;
    }
}

class NotFollowedBy extends Parser {
    constructor(parser_1, parser_2) {
        super();
        this.parser_1 = parser_1;
        this.parser_2 = parser_2;
    }

    match(string, index) {
        let result = this.parser_1.match(string, index);
        let succeed = true;

        try {
            let _result = this.parser_2.match(string, result.get_to());
            succeed = false;
        } catch (e) {
            succeed = true;
        }

        if (succeed) {
            return result;
        } else {
            throw new NoMatch(string, index, this);
        }
    }

    toString() {
        return `new NotFollowedBy(${this.parser_1.toString()}, ${this.parser_2.toString()})`;
    }
}

var should_trace = true;

function should_trace_parser() {
    return should_trace;
}

function trace_parser_on() {
    should_trace = true;
}

function trace_parser_off() {
    should_trace = false;
}

class Tracer extends Parser {
    constructor(parser, desc) {
        super();
        this.parser = parser;
        this.desc = desc;
    }

    match(string, index) {
        let message = '';
        if (should_trace_parser()) {
            message = `${this.desc} parser on the string "${string.substr(index, 10)}"...`;
            console.log(`;;; Attempting ${message}`);
        }
        try {
            let result = this.parser.match(string, index);
            if (should_trace_parser()) {
                console.log(`;;; Success with ${message}`);
                console.log(`;;;   Found ${JSON.stringify(result.get_value())} in [${result.get_from()}, ${result.get_to()})`);
            }
            return result;
        } catch (failure) {
            if (should_trace_parser()) {
                console.log(`;;; Failed ${message}`);
            }
            throw failure;
        }
    }

    toString() {
        return `new Tracer(${this.parser.toString()})`;
    }
}

// 

class Grammar {
    static start() {
        return new Grammar();
    }

    constructor() {
        this.stack = new Array();
    }

    const(pred) {
        this.stack.push(new Const(pred));
        return this;
    }

    push(parser) {
        this.stack.push(parser);
        return this;
    }

    delayed(a_thunk) {
        this.stack.push(new Delayed(a_thunk));
        return this;
    }

    done() {
        if (this.stack.length > 1) {
            console.log(`Leaving ${this.stack.length - 1} parsers on the stack!`);
        }

        return this.stack.pop();
    }

    constant(pred) {
        this.stack.push(new Const(pred));
        return this;
    }

    caten() {
        let p2 = this.stack.pop();
        let p1 = this.stack.pop();
        this.stack.push(new Caten(p1, p2));
        return this;
    }

    disj() {
        let p2 = this.stack.pop();
        let p1 = this.stack.pop();
        this.stack.push(new Disj(p1, p2));
        return this;
    }

    diff() {
        let p2 = this.stack.pop();
        let p1 = this.stack.pop();
        this.stack.push(new Diff(p1, p2));
        return this;
    }

    followed_by() {
        let p2 = this.stack.pop();
        let p1 = this.stack.pop();
        this.stack.push(new FollowedBy(p1, p2));
        return this;
    }

    not_followed_by() {
        let p2 = this.stack.pop();
        let p1 = this.stack.pop();
        this.stack.push(new NotFollowedBy(p1, p2));
        return this;
    }

    star() {
        let p = this.stack.pop();
        this.stack.push(new Star(p));
        return this;
    }

    plus() {
        let p = this.stack.pop();
        this.stack.push(new Plus(p));
        return this;
    }

    maybe() {
        let p = this.stack.pop();
        this.stack.push(new Maybe(p));
        return this;
    }

    power(n) {
        let p = this.stack.pop();
        this.stack.push(new Power(p, n));
        return this;
    }

    guard(g) {
        let p = this.stack.pop();
        this.stack.push(new Guard(p, g));
        return this;
    }

    doc(documentation) {
        let p = this.stack.pop();
        this.stack.push(new Doc(p, documentation));
        return this;
    }

    trace(desc) {
        let p = this.stack.pop();
        this.stack.push(new Tracer(p, desc));
        return this;
    }

    pack(callback) {
        let p = this.stack.pop();
        this.stack.push(new Pack(p, callback));
        return this;
    }

    // a -- a a
    dup() {
        let p = this.stack.pop();
        this.stack.push(p);
        this.stack.push(p);
        return this;
    }

    // a b -- b a
    swap() {
        let p2 = this.stack.pop();
        let p1 = this.stack.pop();
        this.stack.push(p2);
        this.stack.push(p1);
        return this;
    }

    // a b -- b a b
    tuck() {
        let p2 = this.stack.pop();
        let p1 = this.stack.pop();
        this.stack.push(p2);
        this.stack.push(p1);
        this.stack.push(p2);
    }

    xor() {
        let p2 = this.stack.pop();
        let p1 = this.stack.pop();
        this.stack.push(p1);
        this.stack.push(p2);
        this.diff();
        this.stack.push(p2);
        this.stack.push(p1);
        this.diff();
        this.disj();
        return this;
    }

    to_left() {
        this.pack(
            (arr) => {
                let result = arr[0];
                result.push(arr[1]);
                return result;
            }
        );

        return this;
    }

    to_right() {
        this.pack(
            (arr) => {
                let result = arr[1];
                result.unshift(arr[0]);
                return result;
            }
        );

        return this;
    }

    print_stack() {
        let i = 0;
        let j = this.stack.length;

        console.log(`The stack contains ${this.stack.length} elements`);
        for (; i < this.stack.length; ++i, --j) {
            console.log(`${j}:\t${this.stack[i].toString()}`);
        }

        return this;
    }
}

//

function string_equal(string_1, string_2) {
    return (string_1 == string_2);
}

function string_equal_ci(string_1, string_2) {
    return (string_1.toLowerCase() == string_2.toLowerCase());
}

function string_le(string_1, string_2) {
    return (string_1 <= string_2);
}

function string_le_ci(string_1, string_2) {
    return (string_1.toLowerCase() <= string_2.toLowerCase());
}

function make_character(equal) {
    return (char_target) =>
        new Const((ch) => equal(char_target, ch));
}

var character = make_character(string_equal);

var character_ci = make_character(string_equal_ci);

function make_word(character) {
    return ((word) => catens(map(((ch) => character(ch)), word)));
}

var word = make_word(character);

var word_ci = make_word(character_ci);

function make_one_of(character) {
    return ((word) => disjs(map(((ch) => character(ch)), word)));
}

var one_of = make_one_of(character);

var one_of_ci = make_one_of(character_ci);

function make_range(string_le) {
    return ((ch_from, ch_to) =>
        new Const((ch) =>
            string_le(ch_from, ch) &&
            string_le(ch, ch_to)));
}

var range = make_range(string_le);

var range_ci = make_range(string_le_ci);

function make_wrapped(nt_left, nt_right) {
    return (nt) =>
        Grammar
            .start()
            .push(catens([nt_left, nt, nt_right]))
            .pack((arr) => arr[1])
            .done();
}

function make_separated_by(nt, nt_sep) {
    return Grammar
        .start()
        .push(nt)

        .push(nt_sep)
        .push(nt)
        .caten()
        .pack((arr) => arr[1])
        .star()

        .caten()
        .to_right()
        .maybe()
        .pack((arr) => {
            if (arr[0]) {
                // found
                return arr[1];
            } else {
                // not found
                return new Array();
            }
        })
        .done();
}

//

function test_string(parser, string, index = 0) {
    try {
        let result = parser.match(string, index);
        console.log(`
Match (${typeof (result.get_value())}) found between ${result.get_from()} and ${result.get_to()}:
${JSON.stringify(result.get_value())}
Remaining chars:
${JSON.stringify(result.get_string().substring(result.get_to(), result.get_string().length))}
`
        );
        return result.get_value();
    } catch (e) {
        console.log(`
Match not found
`
        );
        return false;
    }
}

module.exports = {
    character, character_ci, word, word_ci, range, range_ci,
    one_of, one_of_ci, make_separated_by, make_wrapped,
    fold_left, fold_right, Const, Caten, Disj, Diff, Star, Plus,
    NotFollowedBy, FollowedBy, Pack, nt_epsilon, nt_fail, nt_end_of_input,
    nt_any_char, catens, disjs, Maybe, Power, Guard, trace_parser_off, trace_parser_on,
    Tracer, Grammar, test_string
};

// end-of-input

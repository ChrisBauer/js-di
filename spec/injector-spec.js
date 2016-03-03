'use strict';

function A (B, C) {
    this.bVal = B.getBVal();
    this.cVal = C.cVal;

    return this;
}
A._inject = ['B', 'C'];

function registerA (B, C) {
    return new A(B, C);
}
registerA._inject = A._inject;

function B () {
    var s = '1234';
    this.getBVal = function () {
        return s;
    };
};

function registerB() {
    return new B();
}

function C (D) {
    var n = 123;
    return {
        cVal: D.getD(),
        getNumber: function () {
            return n;
        }
    };
}

C._inject = ['D'];

function D () {
    var dVal = 5;
    return {
        getD: function () {
            return dVal;
        }
    };
};

function DPrime (A) {
    // for testing circular dependencies
}
DPrime._inject = ['A'];

describe('injector', function () {

    it ('should pass', function () {
        expect(true).toBe(true);
    });

    describe('configuration', function () { 
        beforeEach(function () {
            this.injector = require('../src/injector');
        });

        it('should register a simple instance', function () {
            this.injector.register({B: registerB});
            var b = this.injector.getInstance('B');
            expect(b).toBeDefined();
            expect(b.getBVal()).toEqual('1234');
        });

        it('should register dependencies properly', function () {
            this.injector.register({D: D, B: registerB, C: C, A: registerA});
            var a = this.injector.getInstance('A');
            var b = this.injector.getInstance('B');
            var c = this.injector.getInstance('C');
            var d = this.injector.getInstance('D');

            expect(a).toBeDefined();
            expect(b).toBeDefined();
            expect(c).toBeDefined();
            expect(d).toBeDefined();

            expect(a.bVal).toBe(b.getBVal());
            expect(a.cVal).toBe(c.cVal);
            expect(a.cVal).toBe(d.getD());

            expect(c.cVal).toBe(d.getD());
        });

        it('should register dependencies regardless of order', function () {
            this.injector.register({A: registerA, B: registerB, C: C, D: D});
            var a = this.injector.getInstance('A');
            var b = this.injector.getInstance('B');
            var c = this.injector.getInstance('C');
            var d = this.injector.getInstance('D');

            expect(a).toBeDefined();
            expect(b).toBeDefined();
            expect(c).toBeDefined();
            expect(d).toBeDefined();

            expect(a.bVal).toBe(b.getBVal());
            expect(a.cVal).toBe(c.cVal);
            expect(a.cVal).toBe(d.getD());

            expect(c.cVal).toBe(d.getD());
        });
    });

    describe('containers', function () {
    });

});

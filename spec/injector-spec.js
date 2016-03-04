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
    // no code - this function is just to test the circular dependency check
}
DPrime._inject = ['A'];

function E () {
    return {
        getD: function () {
            return 'E';
        }
    };
}

describe('injector', function () {

    it ('should pass', function () {
        expect(true).toBe(true);
    });

    describe('configuration', function () { 
        beforeEach(function () {
            this.injector = require('../src/injector');
        });

        afterEach(function () {
            this.injector.removeAll();
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

        it('should throw if circular dependencies are found', function () {
            function shouldThrow () {
                this.injector.register({A: registerA, B: registerB, C: C, D: DPrime});
            }

            expect(shouldThrow.bind(this)).toThrow(new Error('CircularDependencyError: failed to register dependencies'));
        });
    });

    describe('containers', function () {
        beforeEach(function () {
            this.injector = require('../src/injector');

            /* Testing of Container Inheritance
             *
             * Inheritance Tree 
             *        ROOT
             *       /    \
             *  childA    childB
             *     |
             *  grandChild
             * 
             * Dep Tree:
             *
             *       ROOT: {A: A->{[LOCAL]B, [LOCAL]C}, B: B, C: C->{[LOCAL]D}, D: D}
             *      /    \
             *     |    childB: {A: [A->{[ROOT]B, [LOCAL]C}, B: [ROOT]B, C: C->[LOCAL]D, D: E}
             *     |
             *  childA: {A: [ROOT]A, B: [ROOT]B, C: [ROOT]C, D: E}
             *     |
             *  grandChild: {A: [ROOT]A, B: [ROOT]B, C: C->{PARENT[D]}, D: [PARENT]D}
             */
            this.childA = this.injector.createContainer('childA');
            this.childB = this.injector.createContainer('childB');
            this.grandChild = this.injector.createContainer('grandChild', this.childA);

            this.injector.register({A: registerA, B: registerB, C: C, D: D});
            this.childA.register({D: E});
            this.childB.register({A: registerA, C: C, D: E});
            this.grandChild.register({C: C})
        });

        afterEach(function () {
            this.injector.removeAll();
        });

        it('should populate root appropriately', function () {
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

        it('should populate childA appropriately', function () {
            var a = this.childA.get('A');
            var b = this.childA.get('B');
            var c = this.childA.get('C');
            var d = this.childA.get('D');

            expect(a).toBeDefined();
            expect(b).toBeDefined();
            expect(c).toBeDefined();
            expect(d).toBeDefined();

            expect(a.bVal).toBe(b.getBVal());
            expect(a.cVal).toBe(c.cVal);

            expect(d.getD()).toBe('E');

            expect(a.cVal).not.toBe(d.getD());
            expect(c.cVal).not.toBe(d.getD());
        });

        it('should populate childB appropriately', function () {
            var rootA = this.injector.getInstance('A');
            var rootB = this.injector.getInstance('B');
            var rootC = this.injector.getInstance('C');
            var rootD = this.injector.getInstance('D');

            var a = this.childB.get('A');
            var b = this.childB.get('B');
            var c = this.childB.get('C');
            var d = this.childB.get('D');

            expect(a).toBeDefined();
            expect(b).toBeDefined();
            expect(c).toBeDefined();
            expect(d).toBeDefined();

            // this container's A should point to ROOT B but its own C -> D
            expect(a.bVal).toBe(a.bVal);
            expect(a.cVal).toBe('E');
        });

        it('should populate grandChild appropriately', function () {
            var rootA = this.injector.getInstance('A');
            var rootB = this.injector.getInstance('B');
            var rootC = this.injector.getInstance('C');
            var rootD = this.injector.getInstance('D');

            var parentA = this.childA.get('A');
            var parentB = this.childA.get('B');
            var parentC = this.childA.get('C');
            var parentD = this.childA.get('D');

            var a = this.grandChild.get('A');
            var b = this.grandChild.get('B');
            var c = this.grandChild.get('C');
            var d = this.grandChild.get('D');

            expect(a).toBeDefined();
            expect(b).toBeDefined();
            expect(c).toBeDefined();
            expect(d).toBeDefined();

            // this container's registered A should be the same as the root container
            expect(a.bVal).toBe(rootB.getBVal());
            expect(a.cVal).toBe(rootC.cVal);
            expect(a.cVal).toBe(rootD.getD());

            // this container's registered C should use its parent's D->E as it's D val
            expect(c.cVal).toBe('E');
            expect(c.cVal).not.toBe(parentC.cVal);
        });
    });

});

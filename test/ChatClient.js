describe('ChatClient Class', () => {
    context('When I create an instance without a custom EventHandler or MessageHandler', () => {
        it('Shouldn\'t throw and Exception', (done) => {
            chai.expect(() => new ChatClient).to.not.throw();
            done();
        });
    });

    describe('When I create an instance with a Custom EventHandler', () => {
        context('Which extends from Listeners', () => {
            it('Should not throw an exception', (done) => {

                class TestEventHandler extends Listeners{}

                chai.expect(() => new ChatClient(TestEventHandler)).to.not.throw();
                done();
            });
        });

        context('Which doesn\'t extend from Listeners', () => {
            it('Should throw an exception', (done) => {
                class TestEventHandler {}
                chai.expect(() => new ChatClient(TestEventHandler)).to.throw();
                done();
            });
        });
    });

    describe('When I create an instance with a Custom MessageHandler', () => {
        context('Which extends from Message', () => {
            it('Should not throw an exception', (done) => {

                class TestMessageHandler extends Message{}

                chai.expect(() => new ChatClient(null, TestMessageHandler)).to.not.throw();
                done();
            });
        });

        context('Which doesn\'t extend from Listeners', () => {
            it('Should throw an exception', (done) => {
                class TestMessageHandler {}
                chai.expect(() => new ChatClient(null, TestMessageHandler)).to.throw();
                done();
            });
        });
    });



});

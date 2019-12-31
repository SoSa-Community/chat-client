describe('ChatClient Class', () => {
    context('When I create an instance without a custom EventHandler or MessageHandler', () => {
        it('Shouldn\'t throw and Exception', (done) => {
            chai.expect(() => new ChatClient).to.not.throw();
            done();
        });
    });

    describe('When I create an instance with a Custom EventHandler', () => {
        context('Which extends from ChatEventHandler', () => {
            it('Should not throw an exception', (done) => {

                class TestEventHandler extends ChatEventHandler{}

                chai.expect(() => new ChatClient(TestEventHandler)).to.not.throw();
                done();
            });
        });

        context('Which doesn\'t extend from ChatEventHandler', () => {
            it('Should throw an exception', (done) => {
                class TestEventHandler {}
                chai.expect(() => new ChatClient(TestEventHandler)).to.throw();
                done();
            });
        });
    });

    describe('When I create an instance with a Custom MessageHandler', () => {
        context('Which extends from ChatMessageHandler', () => {
            it('Should not throw an exception', (done) => {

                class TestMessageHandler extends ChatMessageHandler{}

                chai.expect(() => new ChatClient(null, TestMessageHandler)).to.not.throw();
                done();
            });
        });

        context('Which doesn\'t extend from ChatEventHandler', () => {
            it('Should throw an exception', (done) => {
                class TestMessageHandler {}
                chai.expect(() => new ChatClient(null, TestMessageHandler)).to.throw();
                done();
            });
        });
    });



});

$(function () {

    describe('The Menu', function () {
        var $menuButton = $('.hamburger');
        var $menu = $('.menu');

        // Make sure we don't see the menu at load
        it('is hidden at DOM load', function () {
            expect($menu.hasClass('is-active')).toBe(false);
            expect($menu.is(':visible')).toBe(false);
        });

        // Can we toggle the menu visibility?
        it('can be toggled with interaction', function () {
            $menuButton.click();
            expect($menuButton.hasClass('is-active')).toBe(true);
            expect($menu.is(':visible')).toBe(true);
            $menuButton.click();
            expect($menuButton.hasClass('is-active')).toBe(false);
            expect($menu.is(':visible')).toBe(false);
        });

    });

    describe('View', function() {
        beforeEach(function (done) {
            control.view.change('intro', done);
        });


        it('should load on init', function(done) {
            expect(control.view.change).toBeDefined();
            done();
        });
    });

    describe('View changer', function () {

        beforeEach(function (done) {
            control.view.change('resume', done);
        });

        it('should load a new view', function (done) {
            expect(control.view.change).toBeDefined();
            done();
        });
    });

    describe('Gallery', function() {

        it('should have a hover state', function() {
            // expect().toEqual();
        });
        it('should navigate to the project', function () {
            //
        });
    });



    // RSS Feed Model Tests
    // describe('RSS Feeds', function() {

    //     // Check that the RSS feeds are defined and an empty array
    //     it('are defined', function() {
    //         expect(allFeeds).toBeDefined();
    //         expect(allFeeds.length).not.toBe(0);
    //     });

    //     // Check that all RSS feeds have a url and it is not empty
    //     it('have a url', function () {
    //         for (var i = allFeeds.length - 1; i >= 0; i--) {
    //             expect(allFeeds[i].url).toBeDefined();
    //             expect(allFeeds[i].url.length).not.toBe(0);
    //             expect(allFeeds[i].url).toMatch(/^(http|https):\/\//);
    //         }
    //     });

    //     // Check that the RSS feeds all have a name and it is not empty
    //     it('have a name', function () {
    //         for (var i = allFeeds.length - 1; i >= 0; i--) {
    //             expect(allFeeds[i].name).toBeDefined();
    //             expect(allFeeds[i].name.length).not.toBe(0);
    //             expect(typeof allFeeds[i].name).toBe('string');
    //         }
    //     });

    // });

});

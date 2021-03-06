var vows = require('vows'),
    assert = require('assert'),
    _ = require('underscore'),
    seq = require('seq'),
    AssetGraph = require('assetgraph');

require('../lib/registerTransforms');

vows.describe('Postprocess images').addBatch({
    'After loading the test case': {
        topic: function () {
            new AssetGraph({root: __dirname + '/postProcessCssImages/'})
                .loadAssets('style.css')
                .populate()
                .run(this.callback);
        },
        'the graph contains the expected assets and relations': function (assetGraph) {
            assert.equal(assetGraph.findAssets().length, 3);
            assert.equal(assetGraph.findAssets({type: 'Png'}).length, 2);
            assert.equal(assetGraph.findAssets({type: 'Css'}).length, 1);
            assert.equal(assetGraph.findRelations({type: 'CssImage'}).length, 2);
        },
        'then running the postProcessCssImages transform': {
            topic: function (assetGraph) {
                assetGraph
                    .postProcessCssImages()
                    .run(this.callback);
            },
            'the number of Png assets should be 3': function (assetGraph) {
                assert.equal(assetGraph.findAssets({type: 'Png'}).length, 3);
            },
            'the first two CssImage relations should be in the same cssRule': function (assetGraph) {
                var cssBackgroundImages = assetGraph.findRelations({type: 'CssImage'});
                assert.equal(cssBackgroundImages[0].cssRule, cssBackgroundImages[1].cssRule);
            },
            'then fetching the source of the two images': {
                topic: function (assetGraph) {
                    return assetGraph.findRelations({type: 'CssImage'}).map(function (cssImageRelation) {
                        return cssImageRelation.to.rawSrc;
                    });
                },
                'should return something that looks like Pngs': function (rawSrcs) {
                    assert.deepEqual(_.toArray(rawSrcs[0].slice(0, 4)), [0x89, 0x50, 0x4e, 0x47]);
                    assert.deepEqual(_.toArray(rawSrcs[1].slice(0, 4)), [0x89, 0x50, 0x4e, 0x47]);
                },
                'the second one should be smaller than the first': function (rawSrcs) {
                    assert.lesser(rawSrcs[1].length, rawSrcs[0].length);
                }
            }
        }
    }
})['export'](module);

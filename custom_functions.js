
var MyCustomFunctions = function () {
    var self = this;
    self.decideBlackListWhiteList = function (inDecisionValue, inEvaluatedValueForBlackList, inBlackListArray, inEvaluatedValueForWhiteList, inWhiteListArray, inValueToEvaluate) {
        var outResultBoolean = false;
        var switchChoices = {
            'BlackList': inEvaluatedValueForBlackList,
            'WhiteList': inEvaluatedValueForWhiteList
        };
        switch (inDecisionValue) {
            case switchChoices['BlackList']:
                if (inBlackListArray.indexOf(inValueToEvaluate) === -1) {
                    outResultBoolean = true;
                }
                break;
            case switchChoices['WhiteList']:
                if (inWhiteListArray.indexOf(inValueToEvaluate) > -1) {
                    outResultBoolean = true;
                }
                break;
            default:
                // intentionally left black as is not supposed to change default valuation
                break;
        }
        return outResultBoolean;
    };
};

module.exports = MyCustomFunctions;

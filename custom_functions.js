
var myCustomFunctions = function () {
    var self = this;
    self.decideBlackListWhiteList = function (inDecisionValue, inEvaluatedValueForBlackList, inBlackListArray, inEvaluatedValueForWhiteList, inWhiteListArray, inValueToEvaluate) {
        var outResultBoolean = false;
        switch (inDecisionValue) {
            case inEvaluatedValueForWhiteList:
                if (inWhiteListArray.indexOf(inValueToEvaluate) > -1) {
                    outResultBoolean = true;
                }
                break;
            case inEvaluatedValueForBlackList:
                if (inBlackListArray.indexOf(inValueToEvaluate) === -1) {
                    outResultBoolean = true;
                }
                break;
        }
        return outResultBoolean;
    };
};

module.exports = myCustomFunctions;

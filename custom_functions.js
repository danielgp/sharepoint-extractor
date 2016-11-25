
var MyCustomFunctions = function () {
    var self = this;
    self.decideBlackListWhiteList = function (inDecisionValue, inEvaluatedValueForBlackList, inBlackListArray, inEvaluatedValueForWhiteList, inWhiteListArray, inValueToEvaluate) {
        var outResultBoolean = false;
        if (inDecisionValue === inEvaluatedValueForBlackList) {
            if (inBlackListArray.indexOf(inValueToEvaluate) === -1) {
                outResultBoolean = true;
            }
        } else if (inDecisionValue === inEvaluatedValueForWhiteList) {
            if (inWhiteListArray.indexOf(inValueToEvaluate) > -1) {
                outResultBoolean = true;
            }
        }
        return outResultBoolean;
    };
};

module.exports = MyCustomFunctions;

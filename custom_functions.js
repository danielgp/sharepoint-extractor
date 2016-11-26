
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
    self.buildRequestQuery = function (targetSharePointURL, crtListName, queryType, headerOptions) {
        var queryPrefix = '';
        switch (queryType) {
            case 'Fields':
            case 'Items':
                queryPrefix = '_api/web/lists/GetByTitle(\'' + crtListName + '\')/' + queryType;
                break;
            case 'Lists':
            default:
                queryPrefix = '_api/web/Lists';
                break;
        }
        return {
            url: targetSharePointURL + queryPrefix,
            headers: headerOptions,
            json: true
        };
    };
};

module.exports = MyCustomFunctions;

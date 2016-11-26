
module.exports = {
    decideBlackListWhiteList: function (inDecisionValue, inEvaluatedValueForBlackList, inBlackListArray, inEvaluatedValueForWhiteList, inWhiteListArray, inValueToEvaluate) {
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
    },
    buildRequestQuery: function (targetSharePointURL, crtListName, queryType, headerOptions) {
        var queryPrefix = '';
        if ((queryType === 'Fields') || (queryType === 'Items')) {
            queryPrefix = '_api/web/lists/GetByTitle(\'' + crtListName + '\')/' + queryType;
        } else if (queryType === 'Lists') {
            queryPrefix = '_api/web/' + queryType;
        }
        return {
            url: targetSharePointURL + queryPrefix,
            headers: headerOptions,
            json: true
        };
    }
}


module.exports = {
    decideBlackListWhiteList: function (inDecisionValue, inEvaluatedValueForBlackList, inBlackListArray, inEvaluatedValueForWhiteList, inWhiteListArray, inValueToEvaluate) {
        if ((inDecisionValue === inEvaluatedValueForBlackList) && (inBlackListArray.indexOf(inValueToEvaluate) === -1)) {
            return true;
        }
        if ((inDecisionValue === inEvaluatedValueForWhiteList) && (inWhiteListArray.indexOf(inValueToEvaluate) > -1)) {
            return true;
        }
        return false;
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

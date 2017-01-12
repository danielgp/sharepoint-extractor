
module.exports = {
    buildAuthenticationHeader: function (inAuthenticationArray) {
        if (inAuthenticationArray.type === 'Addin') {
            return inAuthenticationArray.credentials_Addin;
        } else if (inAuthenticationArray.type === 'SAML') {
            return inAuthenticationArray.credentials_SAML;
        }
    },
    buildCurrentListAttributeValues: function (inObjectListsConfiguredAttributes, inCurrentList) {
        var crtListAttributes = [];
        Object.keys(inObjectListsConfiguredAttributes).map(function (itemList) {
            if (itemList.substring(0, 4) === 'Date') {
                if (inCurrentList[inObjectListsConfiguredAttributes[itemList]] === null) {
                    crtListAttributes[itemList] = '';
                } else {
                    crtListAttributes[itemList] = inCurrentList[inObjectListsConfiguredAttributes[itemList]].replace('T', ' ').replace('Z', '');
                }
            } else {
                crtListAttributes[itemList] = inCurrentList[inObjectListsConfiguredAttributes[itemList]];
            }
        });
        return crtListAttributes;
    },
    buildRequestQuery: function (targetSharePointURL, crtListName, queryType, headerOptions, maxRecords) {
        var queryPrefix = '';
        switch (queryType) {
            case 'Fields':
                queryPrefix = '_api/Web/lists/GetByTitle(\'' + crtListName + '\')/' + queryType;
                break;
            case 'Items':
                queryPrefix = '_api/Web/lists/GetByTitle(\'' + crtListName + '\')/' + queryType + '?$top=' + maxRecords;
                break;
            default:
                queryPrefix = '_api/Web/' + queryType;
                break;
        }
        return {
            url: targetSharePointURL + queryPrefix,
            headers: headerOptions,
            json: true
        };
    },
    decideBlackListWhiteList: function (inDecisionValue, inEvaluatedValueForBlackList, inBlackListArray, inEvaluatedValueForWhiteList, inWhiteListArray, inValueToEvaluate) {
        if ((inDecisionValue === inEvaluatedValueForBlackList) && (inBlackListArray.indexOf(inValueToEvaluate) === -1)) {
            return true;
        }
        if ((inDecisionValue === inEvaluatedValueForWhiteList) && (inWhiteListArray.indexOf(inValueToEvaluate) > -1)) {
            return true;
        }
        return false;
    }
};


module.exports = {
    buildAuthenticationHeader: function (inAuthenticationArray) {
        switch (inAuthenticationArray.type) {
            case 'Addin':
                return inAuthenticationArray.credentials_Addin;
                break;
            case 'SAML':
                return inAuthenticationArray.credentials_SAML;
                break;
        }
        return false;
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
        var arStandardLists = {
            'Fields': {
                'WebAPItrunk': 'Lists',
                'WebAPIdeterminationFunction': 'GetByTitle',
                'WebAPIdeterminationElement': 'Fields'
            },
            'GroupMembers': {
                'WebAPItrunk': 'SiteGroups',
                'WebAPIdeterminationFunction': 'GetById',
                'WebAPIdeterminationElement': 'Users'
            },
            'Items': {
                'WebAPItrunk': 'Lists',
                'WebAPIdeterminationFunction': 'GetByTitle',
                'WebAPIdeterminationElement': 'Items' + '?$top=' + maxRecords
            },
            'Views': {
                'WebAPItrunk': 'Lists',
                'WebAPIdeterminationFunction': 'GetByTitle',
                'WebAPIdeterminationElement': 'Views'
            }
        };
        var queryPrefix = '';
        if (Object.keys(arStandardLists).indexOf(queryType) > -1) {
            queryPrefix = '_api/Web/' + arStandardLists[queryType]['WebAPItrunk']
                    + '/' + arStandardLists[queryType]['WebAPIdeterminationFunction'] + '(\''
                    + crtListName + '\')/' + arStandardLists[queryType]['WebAPIdeterminationElement'];
        } else {
            queryPrefix = '_api/Web/' + queryType;
        }
        return {
            url: targetSharePointURL + queryPrefix,
            headers: headerOptions,
            json: true
        };
    },
    decideBlackListWhiteList: function (inDecisionValue, inEvaluatedValueForBlackList, inBlackListArray, inEvaluatedValueForWhiteList, inWhiteListArray, inValueToEvaluate) {
        var bolReturn = false;
        switch (inDecisionValue) {
            case inEvaluatedValueForBlackList:
                if (inBlackListArray.indexOf(inValueToEvaluate) === -1) {
                    bolReturn = true;
                }
                break;
            case inEvaluatedValueForWhiteList:
                if (inWhiteListArray.indexOf(inValueToEvaluate) > -1) {
                    bolReturn = true;
                }
                break;
        }
        return bolReturn;
    }
};

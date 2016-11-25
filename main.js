var spauth = require('node-sp-auth');
var request = require('request-promise');
var config = require('./config.json');
var MyCustomFunctions = require('./custom_functions.js');
var targetSharePoint = require('./targetSharePoint.json');
var fs = require('fs');

spauth
        .getAuth(targetSharePoint.URL, {
            username: targetSharePoint.credentials.username,
            password: targetSharePoint.credentials.password
        })
        .then(function (data) {
            var fsOptions = {
                encoding: 'utf8'
            };
            var headerOptions = data.headers;
            headerOptions['Accept'] = 'application/json;odata=verbose';
            var ListNameArray = [];
            request.get({
                url: targetSharePoint.URL + '_api/web/Lists',
                headers: headerOptions,
                json: true
            }).then(function (response) {
                var dataObjectLists = response.d.results;
                if (Object.keys(dataObjectLists).length > 0) {
                    var dataListLight = [];
                    var counter = 0;
                    dataObjectLists.forEach(function (item) {
                        dataListLight[counter] = {
                            'Created': item.Created.replace('T', ' ').replace('Z', ''),
                            'Description': item.Description,
                            'EnableAttachments': item.EnableAttachments,
                            'EnableFolderCreation': item.EnableFolderCreation,
                            'EnableVersioning': item.EnableVersioning,
                            'Hidden': item.Hidden,
                            'Id': item.Id,
                            'IsPrivate': item.IsPrivate,
                            'ItemCount': item.ItemCount,
                            'LastItemDeletedDate': item.LastItemDeletedDate.replace('T', ' ').replace('Z', ''),
                            'LastItemModifiedDate': item.LastItemModifiedDate.replace('T', ' ').replace('Z', ''),
                            'LastItemUserModifiedDate': item.LastItemUserModifiedDate.replace('T', ' ').replace('Z', ''),
                            'MajorVersionLimit': item.MajorVersionLimit,
                            'NoCrawl': item.NoCrawl,
                            'ParserDisabled': item.ParserDisabled,
                            'Title': item.Title
                        };
                        ListNameArray[counter] = item.Title;
                        counter++;
                    });
                    var wStreamList = fs.createWriteStream(config.General.PathForExtracts + config.General.MetadataFileName.Lists + '.csv', fsOptions);
                    var wStreamListFields = fs.createWriteStream(config.General.PathForExtracts + config.General.MetadataFileName.Fields + '.csv', fsOptions);
                    var strListFieldsHeaders = [
                        '_List',
                        'Field Name Displayed',
                        'Field Technical Name',
                        'Field Type',
                        'Field Type Detailed',
                        'Can Be Deleted',
                        'Default Value',
                        'Enforce Unique Values',
                        'Filterable',
                        'Group',
                        'Indexed',
                        'Read Only',
                        'Required',
                        'Sortable',
                        'Validation Formula',
                        'Validation Message',
                        'GUID'
                    ];
                    wStreamListFields.write('"' + strListFieldsHeaders.join('"' + config.General.ListSeparator + '"') + '"\n');
                    wStreamList.write('"' + Object.keys(dataListLight[0]).join('"' + config.General.ListSeparator + '"') + '"\n');
                    dataListLight.forEach(function (crtListParameters) {
                        var crtListName = crtListParameters.Title;
                        var myFunctions = new MyCustomFunctions();
                        var crtListWillBeExtracted = myFunctions.decideBlackListWhiteList(crtListParameters.Hidden, false, config.SharePoint.Filters.Lists.NotHidden.BlackList, true, config.SharePoint.Filters.Lists.Hidden.WhiteList, crtListName);
                        if (crtListWillBeExtracted) {
                            wStreamList.write('"' + Object.keys(crtListParameters).map(function (x) {
                                return crtListParameters[x];
                            }).join('"' + config.General.ListSeparator + '"') + '"\n');
                            // Dynamically detect structure of the list, extracting the Field names and their text to display
                            request.get({
                                url: targetSharePoint.URL + '_api/web/lists/GetByTitle(\'' + crtListName + '\')/Fields',
                                headers: headerOptions,
                                json: true
                            }).then(function (response) {
                                var dataObject = response.d.results;
                                if (Object.keys(dataObject).length > 0) {
                                    var headersArray = [];
                                    var fieldsArray = [];
                                    var fieldsTypeArray = [];
                                    var counter = 0;
                                    dataObject.forEach(function (item) {
                                        var crtRecordFieldWillBeExtracted = myFunctions.decideBlackListWhiteList(item.CanBeDeleted, true, config.SharePoint.Filters.Fields.CanBeDeleted.BlackList, false, config.SharePoint.Filters.Fields.CannotBeDeleted.WhiteList, item.InternalName);
                                        // for certain Lists all existing fields should be retrieved
                                        if (config.SharePoint.Filters.Lists.Hidden.WhiteList.indexOf(crtListName) > -1) {
                                            crtRecordFieldWillBeExtracted = true;
                                        }
                                        if (crtRecordFieldWillBeExtracted) {
                                            headersArray[counter] = item.Title;
                                            fieldsArray[counter] = item.StaticName;
                                            fieldsTypeArray[counter] = item.TypeAsString;
                                            counter++;
                                            var crtListField = [
                                                crtListName,
                                                item.Title,
                                                item.StaticName,
                                                item.TypeAsString,
                                                item.TypeDisplayName,
                                                item.CanBeDeleted,
                                                item.DefaultValue,
                                                item.EnforceUniqueValues,
                                                item.Filterable,
                                                item.Group,
                                                item.Indexed,
                                                item.ReadOnlyField,
                                                item.Required,
                                                item.Sortable,
                                                item.ValidationFormula,
                                                item.ValidationMessage,
                                                item.Id
                                            ];
                                            wStreamListFields.write('"' + crtListField.join('"' + config.General.ListSeparator + '"') + '"\n');
                                        }
                                    });
                                    // Get the actual values from current list
                                    request.get({
                                        url: targetSharePoint.URL + '_api/web/lists/GetByTitle(\'' + crtListName + '\')/Items',
                                        headers: headerOptions,
                                        json: true
                                    }).then(function (response) {
                                        var fieldsLength = fieldsArray.length;
                                        // output to file only if detectable fields are in scope
                                        if (fieldsLength > 0) {
                                            var wstream = fs.createWriteStream('./results/' + crtListName + '.csv', fsOptions);
                                            if (crtListParameters.EnableVersioning) {
                                                headersArray.push('Version');
                                            }
                                            // writing headers for records within current list
                                            wstream.write('"' + headersArray.join('"' + config.General.ListSeparator + '"') + '"\n');
                                            var dataObjectValues = response.d.results;
                                            if (Object.keys(dataObjectValues).length > 0) {
                                                dataObjectValues.forEach(function (item) {
                                                    var crtRecord = [];
                                                    for (var counterF = 0; counterF < fieldsLength; counterF++) {
                                                        switch (fieldsTypeArray[counterF]) {
                                                            case 'DateTime':
                                                                crtRecord[counterF] = item[fieldsArray[counterF]].replace('T', ' ').replace('Z', '');
                                                                break;
                                                            case 'Lookup':
                                                            case 'User':
                                                                crtRecord[counterF] = item[fieldsArray[counterF] + 'Id'];
                                                                break;
                                                            default:
                                                                crtRecord[counterF] = item[fieldsArray[counterF]];
                                                                break;
                                                        }
                                                    }
                                                    if (crtListParameters.EnableVersioning) {
                                                        crtRecord[counterF] = item.OData__UIVersionString;
                                                    }
                                                    // writing current record values
                                                    wstream.write('"' + crtRecord.join('"' + config.General.ListSeparator + '"') + '"\n');
                                                });
                                            }
                                            wstream.end(function () {
                                                if (config.General.Feedback.FileCompletion.OtherLists) {
                                                    console.log(crtListName + '.csv has been completed!\n' + (config.General.Feedback.ContentAsJSON.OtherLists ? JSON.stringify(dataObjectValues) : ''));
                                                }
                                            });
                                        }
                                    });
                                }
                            });
                        }
                    });
                    wStreamList.end(function () {
                        if (config.General.Feedback.FileCompletion.ListOfLists) {
                            console.log(config.General.MetadataFileName.Lists + '.csv has been completed!\n' + (config.General.Feedback.ContentAsJSON.ListOfLists ? JSON.stringify(dataListLight) : ''));
                        }
                    });
                }
            });
        });

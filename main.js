var spauth = require('node-sp-auth');
var request = require('request-promise');
var config = require('./config.json');
var targetSharePoint = require('./targetSharePoint.json');
var MyCustomFunctions = require('./custom_functions.js');
var myFunctions = new MyCustomFunctions();
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
                    // initiate MetaData for Lists
                    var wStreamList = fs.createWriteStream(config.General.PathForExtracts + config.General.MetaDataFileName.Lists + '.csv', fsOptions);
                    // headers of MetaData for Lists
                    wStreamList.write('"' + Object.keys(dataListLight[0]).join('"' + config.General.ListSeparator + '"') + '"\n');
                    // initiate MetaData for Fields
                    var wStreamListFields = fs.createWriteStream(config.General.PathForExtracts + config.General.MetaDataFileName.Fields + '.csv', fsOptions);
                    // headers of MetaData for Fields
                    wStreamListFields.write('"List"' + config.General.ListSeparator + '"' + Object.keys(config.SharePoint.MetaDataOutput.Fields).join('"' + config.General.ListSeparator + '"') + '"\n');
                    // parse each List
                    dataListLight.forEach(function (crtListParameters) {
                        // check current List against configured BlackList and WhiteList besides considering user defined Lists
                        if (myFunctions.decideBlackListWhiteList(crtListParameters.Hidden, false, config.SharePoint.Filters.Lists.NotHidden.BlackList, true, config.SharePoint.Filters.Lists.Hidden.WhiteList, crtListParameters.Title)) {
                            // records detail of current List
                            wStreamList.write('"' + Object.keys(crtListParameters).map(function (x) {
                                return crtListParameters[x];
                            }).join('"' + config.General.ListSeparator + '"') + '"\n');
                            // Dynamically detect structure of the list, extracting the Field names and their text to display
                            request.get({
                                url: targetSharePoint.URL + '_api/web/lists/GetByTitle(\'' + crtListParameters.Title + '\')/Fields',
                                headers: headerOptions,
                                json: true
                            }).then(function (response) {
                                var dataObject = response.d.results;
                                if (Object.keys(dataObject).length > 0) {
                                    var fieldAttributes = [];
                                    var counter = 0;
                                    dataObject.forEach(function (item) {
                                        var crtRecordFieldWillBeExtracted = myFunctions.decideBlackListWhiteList(item.CanBeDeleted, true, config.SharePoint.Filters.Fields.CanBeDeleted.BlackList, false, config.SharePoint.Filters.Fields.CannotBeDeleted.WhiteList, item.InternalName);
                                        // for certain Lists all existing fields should be retrieved
                                        if (config.SharePoint.Filters.Lists.Hidden.WhiteList.indexOf(crtListParameters.Title) > -1) {
                                            crtRecordFieldWillBeExtracted = true;
                                        }
                                        if (crtRecordFieldWillBeExtracted) {
                                            fieldAttributes[item.Title] = {
                                                'Technical Name': item.StaticName,
                                                'Type': item.TypeAsString
                                            };
                                            counter++;
                                            var crtListField = [];
                                            var counterF = 0
                                            Object.keys(config.SharePoint.MetaDataOutput.Fields).forEach(function (itemF) {
                                                crtListField[counterF] = item[config.SharePoint.MetaDataOutput.Fields[itemF]];
                                                counterF++;
                                            });
                                            wStreamListFields.write('"' + crtListParameters.Title + '"' + config.General.ListSeparator + '"' + crtListField.join('"' + config.General.ListSeparator + '"') + '"\n');
                                        }
                                    });
                                    // Get the actual values from current list
                                    request.get({
                                        url: targetSharePoint.URL + '_api/web/lists/GetByTitle(\'' + crtListParameters.Title + '\')/Items',
                                        headers: headerOptions,
                                        json: true
                                    }).then(function (response) {
                                        var wstream = fs.createWriteStream(config.General.PathForExtracts + crtListParameters.Title + '.csv', fsOptions);
                                        // writing headers for records within current list
                                        wstream.write('"' + Object.keys(fieldAttributes).join('"' + config.General.ListSeparator + '"') + (crtListParameters.EnableVersioning ? '"' + config.General.ListSeparator + '"Version' : '') + '"\n');
                                        var dataObjectValues = response.d.results;
                                        if (Object.keys(dataObjectValues).length > 0) {
                                            dataObjectValues.forEach(function (item) {
                                                var crtRecord = [];
                                                var counterF = 0
                                                Object.keys(fieldAttributes).map(function (itemF) {
                                                    switch (fieldAttributes[itemF]['Type']) {
                                                        case 'DateTime':
                                                            crtRecord[counterF] = item[fieldAttributes[itemF]['Technical Name']].replace('T', ' ').replace('Z', '');
                                                            break;
                                                        case 'Lookup':
                                                        case 'User':
                                                            crtRecord[counterF] = item[fieldAttributes[itemF]['Technical Name'] + 'Id'];
                                                            break;
                                                        default:
                                                            crtRecord[counterF] = item[fieldAttributes[itemF]['Technical Name']];
                                                            break;
                                                    }
                                                    counterF++;
                                                });
                                                // writing current record values
                                                wstream.write('"' + crtRecord.join('"' + config.General.ListSeparator + '"') + (crtListParameters.EnableVersioning ? '"' + config.General.ListSeparator + '"' + item.OData__UIVersionString : '') + '"\n');
                                            });
                                        }
                                        wstream.end(function () {
                                            if (config.General.Feedback.FileCompletion.OtherLists) {
                                                console.log(crtListParameters.Title + '.csv has been completed!\n' + (config.General.Feedback.ContentAsJSON.OtherLists ? JSON.stringify(dataObjectValues) : ''));
                                            }
                                        });
                                    });
                                }
                            });
                        }
                    });
                    wStreamList.end(function () {
                        if (config.General.Feedback.FileCompletion.ListOfLists) {
                            console.log(config.General.MetaDataFileName.Lists + '.csv has been completed!\n' + (config.General.Feedback.ContentAsJSON.ListOfLists ? JSON.stringify(dataListLight) : ''));
                        }
                    });
                }
            });
        });

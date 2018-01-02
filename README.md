# sharepoint-extractor
Extract information from online SharePoint using nodeJS framework

# Usage

1. Download and Install nodeJS from "https://nodejs.org/en/download/";
2. Download the latest version of current app from "https://github.com/danielgp/sharepoint-extractor/releases";
3. Extract the archive in a folder of your choice;
4. Execute "npm update" to ensure relevant depedant npm modules will be downloaded to same folder;
5. modify "targetSharePoint.json" with your SharePoint URL in scope and apropriate credentials (if Addin authentication would be in scope, you may be interested in consulting https://github.com/s-KaiNet/node-sp-auth/wiki/SharePoint%20Online%20addin%20only%20authentication for details on how to set it up on Sharepoint);
6. review and adjust to your preferences "config.json", allowing you to be in control of what is in scope and how, with a great deal of flexibility;
7. execute it: "node main.js" and enjoy it for as longs as you desire.


# Features

Metadata output (List details, field from lists, views from lists, security groups and their members)
Content output from list into individual files
Output to CSV files (separator and metadata content file names can be customizing in config.json, lists content will have the same name as the list)
Blacklist / Whitelist for List and Fields to accommodate a wide range of user needs

# Remarks

Any issue you may encounter will be greatly appreciated if you will take the time to highlighted to GitHub repository (https://github.com/danielgp/sharepoint-extractor/issues).
Also should you want to contribute, feel free to clone the repository using Git and raise a "Pull request" against it and will do my best to manage it.

# Testing

So far this script has been tested with the following:

Name                  | Version | Build     | Date
--------------------- | ------- | --------- | ---------------------
Windows 10 Enterprise | 1511    | 10586.769 | 25th of November 2016
Windows 10 Enterprise | 1703    | 15063.726 | 2nd of January 2018

nodeJS           | npm    | Date
---------------- | ------ | ----------------------
6.9.1 LTS 64-bit | 3.10.8 | 25th of November 2016
7.4.0 LTS 64-bit | 4.0.5  | 29th of January 2017
7.5.0 LTS 64-bit | 4.1.2  | 2nd of February 2017
7.6.0 LTS 64-bit | 4.1.2  | 27th of February 2017
7.7.0 LTS 64-bit | 4.1.2  | 1st of March 2017
9.3.0     64-bit | 5.5.1  | 2nd of January 2018

SharePoint | Date
---------- | ---------------------
2013 Cloud | 25th of November 2016

Authentication Type | Date
------------------- | ----------------------
SAML                | 25th of November 2016
AddIn               | 29th of November 2016

#Code quality analysis
[![Scrutinizer Code Quality](https://scrutinizer-ci.com/g/danielgp/sharepoint-extractor/badges/quality-score.png?b=master)](https://scrutinizer-ci.com/g/danielgp/sharepoint-extractor/?branch=master)
[![Build Status](https://scrutinizer-ci.com/g/danielgp/sharepoint-extractor/badges/build.png?b=master)](https://scrutinizer-ci.com/g/danielgp/sharepoint-extractor/build-status/master)

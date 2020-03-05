/*------------------------------------------------------------------------------------------------------/
| Accela Automation
| Accela, Inc.
| Copyright (C): 2012
|
| Program : UniversalMasterScriptV2.0.js
| Event   : UniversalMasterScript
|
| Usage   : Designed to work with most events and generate a generic framework to expose standard master scirpt functionality
|			To utilize associate UniversalMasterScript to event and create a standard choice with same name as event
|			universal master script will execute and attempt to call standard choice with same name as associate event. 
|
| Client  : N/A
| Action# : N/A
|
| Notes   :
|
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START Configurable Parameters
|	The following script code will attempt to read the assocaite event and invoker the proper standard choices
|    
/------------------------------------------------------------------------------------------------------*/
var triggerEvent = aa.env.getValue("EventName");
var controlString = null;
var documentOnly = false;						// Document Only -- displays hierarchy of std choice steps


var preExecute = "PreExecuteForAfterEvents";  		//Assume after event unless before decected
var eventType = "After";				//Assume after event
if (triggerEvent != ""){
	controlString = triggerEvent;			// Standard choice for control
	if(triggerEvent.indexOf("Before") > 0){
		preExecute = "PreExecuteForBeforeEvents";
		eventType = "Before";
	}
}

/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var showMessage = false;                                                                            // Set to true to see results in popup window
var showDebug = false;  
var cancel = false;

var SCRIPT_VERSION = 2.0

eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_ACCELA_GLOBALS"));
eval(getScriptText("INCLUDES_CUSTOM"));

if (documentOnly) {
	doStandardChoiceActions(controlString,false,0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
	}
	
function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";	
}

var cap = aa.env.getValue("CapModel");
var capId = cap.getCapID();
var servProvCode = capId.getServiceProviderCode()                                      // Service Provider Code
var publicUser = false;
var currentUserID = aa.env.getValue("CurrentUserID");
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN"; publicUser = true }  // ignore public users
var capIDString = capId.getCustomID();                                                                 // alternate cap id string
var systemUserObj = aa.person.getUser(currentUserID).getOutput();  // Current User Object
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString();                                  // Convert application type to string ("Building/A/B/C")
var appTypeArray = appTypeString.split("/");                                      // Array of application type string
var currentUserGroup;
var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0], currentUserID).getOutput()
if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();

var AInfo = new Array();                                                                               // Create array for tokenized variables
loadAppSpecific4ACA(AInfo);                         // Add AppSpecific Info



/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
//Log All Environmental Variables as  globals
var params = aa.env.getParamValues();
var keys =  params.keys();
var key = null;
while(keys.hasMoreElements())
{
 key = keys.nextElement();
 eval("var " + key + " = aa.env.getValue(\"" + key + "\");");
 logDebug("Loaded Env Variable: " + key + " = " + aa.env.getValue(key));
}

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

// logGlobals(AInfo);

// var AInfo1 = new Array();                                                                               // Create array for tokenized variables
// loadAppSpecific4ACA(AInfo1);     

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/



docsMissing = false;
showList = true;
var isWall = false;

var docs = aa.document.getCapDocumentList(capId,currentUserID).getOutput();


comment(" at bond record P4 " + capId + " CurrentUserID: " + currentUserID);

for (x in docs)
comment(docs[x].getFileName());

showMessage = true;

//array to look for
r = new Array();

//required document
r[0] = "Site Plan";

//check if commercial or more than 5 units, then Asbestos Survey required
if (AInfo["Type of Occupancy"] == "Commercial" || AInfo["Type of Occupancy"] == "Apartment (5 units or more)")
{
	r[1] = "Asbestos Survey";
}

var docuScriptModel = aa.document.getDocumentListByEntity(capId.toString(), "TMP_CAP");

//get array of docs
var submittedDocList = aa.document.getDocumentListByEntity(capId.toString(), "TMP_CAP").getOutput().toArray();

 uploadedDocs = new Array();
 for (var i in submittedDocList )uploadedDocs[submittedDocList[i].getDocCategory()] = true;
 
 if (r.length > 0 && showList) {
    for (x in r) 
	{ 

		if(uploadedDocs[r[x]] == undefined)  
		{    			
			showMessage = true; 
			cancel=true;
			if (!docsMissing)  {
				comment("<div class='docList'><span class='fontbold font14px ACA_Title_Color'>The following document(s) are required: </span><ol class='fontbold font14px ACA_Title_Color'>");     
				docsMissing = true; 
			}    
			comment("<li>" + r[x] + "</li>");
			
		}    

	}
	if(docsMissing == true)
	{
		comment("</ol>");
	}
}
 
 
 //==
 
 
 
 
 
if (!docuScriptModel.getSuccess()) {
       aa.env.setValue("ErrorMessage", docuScriptModel.getErrorMessage());
}
 
var attachmentList = docuScriptModel.getOutput();



if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
	}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/
if(eventType == "After"){
	if (debug.indexOf("**ERROR") > 0)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		aa.env.setValue("ScriptReturnMessage", debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
		}
}
else{ //Process Before Event with cancel check
	if (debug.indexOf("**ERROR") > 0)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		aa.env.setValue("ScriptReturnMessage", debug);
		}
	else
		{
		if (cancel)
			{
			aa.env.setValue("ScriptReturnCode", "1");
			if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
			if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
			}
		else
			{
			aa.env.setValue("ScriptReturnCode", "0");
			if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
			if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
			}
		}
}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/
	function checkCapForLicensedProfessionalType( licProfType )
{
	var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
	
	if( capLicenseResult.getSuccess() )
	{ 
		var capLicenseArr = capLicenseResult.getOutput();
		
		if (!capLicenseArr)
			{ logDebug("WARNING: no license professional available on the application:"); return false; }
		
		for( licProf in capLicenseArr )
		{
			if( licProfType.equals(capLicenseArr[licProf].getLicenseType()) )
			{
				aa.print( "Found License Professional with Type= " + licProfType );
				return true; //Found Licensed Prof of specified type
			}
		}
		
		return false;
	}
	else
		{ aa.print("**ERROR: getting lic prof: " + capLicenseResult.getErrorMessage()); return false; }
	
	
}

// USE THIS SECTION TO SET ERRORS AND STOP PAGE
if (debug.indexOf("**ERROR") > 0) {
    aa.env.setValue("ErrorCode", "1");
    aa.env.setValue("ErrorMessage", debug);
}
else {
    if (cancel) {
        aa.env.setValue("ErrorCode", "-2");
        if (showMessage) aa.env.setValue("ErrorMessage", message);
        if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
    else {
        aa.env.setValue("ErrorCode", "0");
        if (showMessage) aa.env.setValue("ErrorMessage", message);
        if (showDebug) aa.env.setValue("ErrorMessage", debug);
    }
}
//==========================================

function comment(cstr)
	{
	if (showDebug) logDebug(cstr);
	if (showMessage) logMessage(cstr);
	}
	
	
	function logMessage(dstr)
	{
	message+=dstr + br;
	}
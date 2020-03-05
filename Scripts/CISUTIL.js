showDebug = 3;
debug = "";
br = "";
var sysDate = aa.date.getCurrentDate();
systemUserObj = aa.person.getUser("ADMIN").getOutput(); 
currentUserID = "ADMIN";


eval(getScriptText("INCLUDES_ACCELA_FUNCTIONS"));
eval(getScriptText("INCLUDES_CUSTOM"));


function getScriptText(vScriptName){
	vScriptName = vScriptName.toUpperCase();
	var emseBiz = aa.proxyInvoker.newInstance("com.accela.aa.emse.emse.EMSEBusiness").getOutput();
	var emseScript = emseBiz.getMasterScript(aa.getServiceProviderCode(),vScriptName);
	return emseScript.getScriptText() + "";	
}



var inputData = aa.env.getValue("inputData");

servProvCode = aa.getServiceProviderCode();
outputObj = new outputObject();
jsonObj = JSON.parse(inputData);
requestType = jsonObj["requestType"];
switch ("" + requestType) {
    case "TEST":
    	break;
    case "GETREFCONTACTID":
     	inputObj = jsonObj["inputObject"];
		custNum = inputObj.customerNumber;
		outputObj.refContactId = "" + getRefContactSeqByCustomerNumber(custNum);
		break;
    case "UPDATEREFCONTACT":
    	inputObj = jsonObj["inputObject"];
		c = inputObj.refContact;
    	custNum =  "" + inputObj.refContact.customerNumber;
    	refContactSeqNum = getRefContactSeqByCustomerNumber(custNum);
    	outputObj.refContactId = "" + refContactSeqNum;
    	if (refContactSeqNum < 0) {
    		outputObj.debugInfo += "Creating a new contact";
    		createRefCISCustomer(custNum, c.firstName, c.lastName, c.email, c.phone1, c.phone2, c.phone3);
    	}
    	else {
    		outputObj.debugInfo += "Updating an existing customer ";
    		var refConResult = aa.people.getPeople(refContactSeqNum);
    		if (refConResult.getSuccess()) {
    			var refPeopleModel = refConResult.getOutput();
    			if (refPeopleModel != null) {
    				outputObj.debugInfo += c.phone1;
    				if (c.firstName != null && c.firstName != "") refPeopleModel.setFirstName(c.firstName);
    				if (c.lastName != null && c.lastName != "") refPeopleModel.setLastName(c.lastName);
    				if (c.email != null && c.email != "") refPeopleModel.setEmail(c.email);
    				if (c.phone1 != null && c.phone1 != "") refPeopleModel.setPhone1(c.phone1);
    				if (c.phone2 != null && c.phone2 != "") refPeopleModel.setPhone2(c.phone2);
    				if (c.phone3 != null && c.phone3 != "") refPeopleModel.setPhone3(c.phone3);
    				var edResult = aa.people.editPeople(refPeopleModel);
    				if (!edResult.getSuccess()) {
    					logDebug("Error editing people " + edResult.getErrorMessage())
    					outputObj.debugInfo += ("ERROR " + edResult.getErrorMessage());
    				}
    			}
    		}
		}
    	break;
    case "GETWORKORDERS":
     	inputObj = jsonObj["inputObject"];
		numHours = inputObj.numHours;
		statuses = inputObj.statusList;
		outputObj.altIdList = getWorkOrders(numHours, statuses).join();
		break;
    case "GETSTATUSINFO":
     	inputObj = jsonObj["inputObject"];
		altId = inputObj.altId;
		statuses = inputObj.statusList;
		capIdObj = aa.cap.getCapID(altId);
		if (capIdObj.getSuccess()) { 
		    	capId = capIdObj.getOutput(); 
		    	sObj = getMostRecentAppStatus(statuses);
		    	outputObj.statusInfo = sObj.status + "|" + sObj.comment + "|" + sObj.statusDateStr + "|" + sObj.auditID;
		}
		break;
	default:
		break;
}

aa.print(outputObj);
outputData =  JSON.stringify(outputObj);
aa.env.setValue("outputData", outputData);

aa.env.setValue("ScriptReturnCode", "0");
aa.env.setValue("ScriptReturnMessage", "OK");

function outputObject() {
	this.refContactId = null;
	this.altIdList = null;
	this.comment = "";
	this.statusInfo = null;
	this.debugInfo = "";
}

function statusObject() {
    this.status = "";
    this.comment = "";
    this.statusDateStr = "";
    this.auditID = "";
}


function getMostRecentAppStatus(statuses) { 
	statArr = statuses.split(",");
	
	var ignoreArray = new Array();

	if (arguments.length > 0) {
		for (var i=0; i<arguments.length;i++) 
			ignoreArray.push(arguments[i]);
	}
	statusResult = aa.cap.getStatusHistoryByCap(capId, "APPLICATION", null);
	if (statusResult.getSuccess()) {
		statusArr = statusResult.getOutput();
		if (statusArr && statusArr.length > 0) {
			statusArr.sort(compareStatusDate);
			for (xx in statusArr) {
				var thisStatus = statusArr[xx];
				var thisStatusStatus = "" + thisStatus.getStatus();
				if (exists(thisStatusStatus, statArr)) {
					retStat = new statusObject();
					retStat.status = thisStatus.getStatus();
					retStat.comment = thisStatus.getStatusComment();
					sDate = thisStatus.getStatusDate();
					retStat.statusDateStr = dateFormatted(sDate.getMonth(),sDate.getDayOfMonth(),sDate.getYear());
					retStat.auditID = thisStatus.getAuditID();
					return retStat;
				}
			}
		}
	}
	else {
		logDebug("Error getting application status history " + statusResult.getErrorMessage());
	}
	return new statusObject();
}

function compareStatusDate(a,b) {
	return (a.getStatusDate().getEpochMilliseconds() > b.getStatusDate().getEpochMilliseconds()); 
}


function getWorkOrders(numHours, statuses) {
	retArray = new Array();
	statusArr = statuses.split(',');
	var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
	var ds = initialContext.lookup("java:/AA");
	var conn = ds.getConnection();
	var selectString = "select b1_alt_id from status_history s inner join b1permit p on (s.serv_prov_code = p.serv_prov_code and s.b1_per_id1 = p.b1_per_id1 and s.b1_per_id2 = p.b1_per_id2 and s.b1_per_id3 = p.b1_per_id3) where s.serv_prov_code = 'MCALLEN'  and patIndex(?, status) > 0 and status_date > dateAdd(hh, -?, getDate())"; 
	var sStmt = conn.prepareStatement(selectString);
	for (sIndex in statusArr) {
		thisStatus = statusArr[sIndex];
		sStmt.setString(1, thisStatus);
		sStmt.setInt(2, parseInt(numHours));
		var rSet = sStmt.executeQuery();
		resultCount = 0;
		while (rSet.next()) {
			retValue = rSet.getString("b1_alt_id");
			if (!IsStrInArry(retValue, retArray))
				retArray.push(retValue);
			resultCount++;
		}
	}
	if (resultCount == 0) logDebug("None");
	else logDebug("Found " + resultCount + " records");
	sStmt.close();
	conn.close();
	return retArray;
}

function IsStrInArry(eVal,argArr) {
   	for (x in argArr){
   		if (eVal == argArr[x]){
   			return true;
   		}
 	  }	
	return false;
}

function createRefCISCustomer(CISCustomerNumber, fName, lName, email, phone1, phone2, phone3) {
	var peopCreateModelResult = aa.people.createPeopleModel();
	var peopCreateModel = peopCreateModelResult.getOutput().getPeopleModel();
	peopCreateModel.setServiceProviderCode(aa.getServiceProviderCode());
	peopCreateModel.setAuditDate(new Date());
	peopCreateModel.setAuditID(currentUserID);
	peopCreateModel.setAuditStatus("A");
	peopCreateModel.setContactType("CIS Customer");
	peopCreateModel.setFirstName(fName);
	peopCreateModel.setLastName(lName);
	peopCreateModel.setEmail(email);
	peopCreateModel.setPhone1(phone1);
	peopCreateModel.setPhone2(phone2);
	peopCreateModel.setPhone3(phone3);
	
	pasm =  aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleAttributeModel").getOutput();
	pasm.setServiceProviderCode(aa.getServiceProviderCode());
	pasm.setAuditStatus("A");
	pasm.setAuditDate(new Date());
	pasm.setAttributeName("CISCUSTID");
	pasm.setAttributeValue(CISCustomerNumber);
	pasm.setContactType("CIS Customer");
	
	pasmColl = aa.util.newArrayList();
	pasmColl.add(pasm);

	var peopleCreateResult = aa.people.createPeopleWithAttribute(peopCreateModel, pasmColl);
}



function getRefContactSeqByCustomerNumber(custNum) {
	var retValue = -1;
	var initialContext = aa.proxyInvoker.newInstance("javax.naming.InitialContext", null).getOutput();
	var ds = initialContext.lookup("java:/AA");
	var conn = ds.getConnection();
	var selectString = "select g1_contact_nbr as cNum from g3contact_attribute where serv_prov_code = 'MCALLEN' and g1_attribute_name = 'CISCUSTID' and g1_attribute_value = ?"; 
	var sStmt = conn.prepareStatement(selectString);
	sStmt.setString(1, "" + custNum);
	var rSet = sStmt.executeQuery();
	resultCount = 0;
	while (rSet.next()) {
		retValue = rSet.getString("cNum");
		resultCount++;
	}
	if (resultCount > 1) logDebug("Reference contact is not unique");
	sStmt.close();
	conn.close();
	return retValue;
}

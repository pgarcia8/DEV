 var mailTO = '';   //Agency user emails;var mailFROM = 'Auto_Sender@Accela.com';var mailCC = '';var mailContentType = 'ACA_EMAIL_INSPECTION_STATUS_CHANGE_CONTENT';var mailSubjectType = 'ACA_EMAIL_INSPECTION_STATUS_CHANGE_SUBJECT';//--------------------------Actual Inspection Status----------------------------//Request Pending. (statusNbr: 1)var INSP_STATUS_PENDING = "Pending";var INSP_STATUS_DESC_PENDING="Insp Pending";//Schedule. (statusNbr: 2)var INSP_STATUS_DESC_SCHEDULED = "Insp Scheduled";var INSP_STATUS_SCHEDULED = "Scheduled";//Rechedule. (statusNbr: 3)var INSP_STATUS_RESCHEDULED = "Rescheduled";var INSP_STATUS_DESC_RESCHEDULED = "Insp Rescheduled";//Cancelled. (statusNbr: 4)var INSP_STATUS_DESC_CANCELLED = "Insp Cancelled";var INSP_STATUS_CANCELLED = "Cancelled";//Result Pending. (statusNbr: 5)INSP_STATUS_RESULT_PENDING="PENDING";// + INSP_STATUS_DESC_SCHEDULED//Result Denied. (statusNbr: 6)var INSP_STATUS_RESULT_DENIED = "DENIED";// + INSP_STATUS_DESC_CANCELLED//Result Approved. (statusNbr: 7)var INSP_STATUS_RESULT_APPROVED = "APPROVED";var INSP_STATUS_DESC_RESULT = "Insp Completed";//--------------------------Actual Inspection Status----------------------------//get cap ID model.var capID = getCapIDModel();	//script entrance.var from = aa.env.getValue("From");var inspIdStr = aa.env.getValue("InspectionIdList");main(capID,inspIdStr,from);//main method.function main(capID,inspIdStr,from){		aa.print("InspectionIdList:: " + inspIdStr);	if(from == null || from.length == 0 || from != "ACA" || inspIdStr == null || inspIdStr.length == 0)	{		return;	}        var inspModelResult = aa.inspection.getInspection(capID,inspIdStr);	if(inspModelResult.getSuccess())	{		var inspScriptModel = inspModelResult.getOutput();		var inspModel = inspScriptModel.getInspection();		var actModel = inspModel.getActivity();						//to identify actual inspection status as below:		//Request Pending. (statusNbr: 1)		//Schedule. (statusNbr: 2)		//Rechedule. (statusNbr: 3)		//Cancelled. (statusNbr: 4)		//Result Pending. (statusNbr: 5)		//Result Denied. (statusNbr: 6)		//Result Approved. (statusNbr: 7)		if(checkInspStatus(2, actModel))		{			aa.print("Check Status: Scheduled");				var sysUserModel = actModel.getSysUser();						//get inspector information.			var inspector = getSysUserByID(sysUserModel.getUserID());						//1.get inspector email.			var inspectorEmail = "";			if(inspector != null && inspector.getEmail() != null)			{				inspectorEmail = inspector.getEmail()			}			aa.print("inspectorEmail:: " + inspectorEmail);						//2.get cap creator email.			var creatorEmails = getCapCreatorEmail(capID);						//3.get the related public user email for owner.			var ownerEmails = getPublicUsersEmail4Owner(capID);						//4.get the related public user email for contact.			var contactEmails = getPublicUsersEmail4Contact(capID);						//5.get the related public user email for professional.			var profEmails = getPublicUsersEmail4Professional(capID);						//filter duplicate emails.			mailTO = filterDuplicateEmails(mailTO + ";" + inspectorEmail + ";" + creatorEmails  + ";" + ownerEmails  + ";" + contactEmails  + ";" + profEmails);						//send email.			sendEmail(mailTO, mailFROM, mailCC, inspModel, actModel, inspector, capID);		}		}}//filter duplicate emails.function filterDuplicateEmails(emailStr){	var rtnEmails = "";	if(emailStr != null && emailStr.length > 0)	{		var temList = aa.util.newArrayList();		var emails = emailStr.split(";");		for(var i=0;i<emails.length;i++)		{			if(emails[i].length > 0 && !temList.contains(emails[i])){				rtnEmails +=  emails[i] + ";" ;					temList.add(emails[i]);			}		}	}	return rtnEmails;}//get the related public user email for owner.function getPublicUsersEmail4Owner(capID){	var emails = "";	var owners = null;	var ownersResult = aa.owner.getOwnerByCapId(capID);	if(ownersResult.getSuccess())	{		owners = ownersResult.getOutput();	}	else	{		aa.log("**ERROR: Failed to get owner list: " + ownersResult.getErrorMessage());		return emails;	}		if (owners != null && owners.length > 0)	{		for(var i=0;i<owners.length;i++)		{			var ownerNbr = owners[i].getL1OwnerNumber();			aa.print("ownerNbr:: " + ownerNbr);			var publicUsers = aa.publicUser.getPublicUserListByOwnerNBR(ownerNbr);			emails += getPublicUsersEmail(publicUsers.getOutput());					}		aa.print("owner public user emails:: " + emails);		return emails;	}	aa.print("owner public user emails:: " + emails);	return emails;	}//get the related public user email for contact.function getPublicUsersEmail4Contact(capID){	var emails = "";	var contacts = null;	var contactsResult = aa.people.getCapContactByCapID(capID);	if(contactsResult.getSuccess())	{		contacts = contactsResult.getOutput();	}	else	{		aa.log("**ERROR: Failed to get contact list: " + contactsResult.getErrorMessage());		return emails;	}		if (contacts != null && contacts.length > 0)	{		for(var i=0;i<contacts.length;i++)		{			var capContact = contacts[i].getCapContactModel();			var refContactNbr = capContact.getRefContactNumber();			aa.print("refContactNbr:: " + refContactNbr);			if(refContactNbr != null)			{				var contactNbr = aa.util.parseLong(refContactNbr);				var publicUsers = aa.publicUser.getPublicUserListByContactNBR(contactNbr);				emails += getPublicUsersEmail(publicUsers.getOutput());			}						aa.print("capContact.getEmail():: " + capContact.getEmail());			if(capContact.getEmail() != null)			{				emails += capContact.getEmail() + ";" ;			}		}		aa.print("contact public user emails:: " + emails);		return emails;	}	aa.print("contact public user emails:: " + emails);		return emails;}//get the related public user email for license professional.function getPublicUsersEmail4Professional(capID){	var emails = "";	var professionals = null;	var professionalsResult = aa.licenseProfessional.getLicensedProfessionalsByCapID(capID);	if(professionalsResult.getSuccess())	{		professionals = professionalsResult.getOutput();	}	else	{		aa.log("**ERROR: Failed to get license professional list: " + professionalsResult.getErrorMessage());		return emails;	}		if (professionals != null && professionals.length > 0)	{		for(var i=0;i<professionals.length;i++)		{			var professional = professionals[i].getLicenseProfessionalModel();			var licSeqNbr = professional.getLicSeqNbr();			aa.print("licSeqNbr:: " + licSeqNbr);			if(licSeqNbr != null)			{				var licNbr = aa.util.parseLong(licSeqNbr);				aa.print("licNbr:: " + licSeqNbr);				var publicUsers = aa.publicUser.getPublicUserListByLicenseSeqNBR(licNbr);				emails += getPublicUsersEmail(publicUsers.getOutput());			}						aa.print("professional.getEmail():: " + professional.getEmail());			if(professional.getEmail() != null)			{				emails += professional.getEmail() + ";" ;			}		}		aa.print("professional public user emails:: " + emails);		return emails;	}	aa.print("professional public user emails:: " + emails);		return emails;	}//get public user email list.function getPublicUsersEmail(users){	aa.print("users:: "+users);	aa.print("users.size():: "+users.size());	var emails = "";	if (users == null || users.isEmpty())	{		return emails;	}		for (var i=0;i<users.size();i++)	{		var user = users.get(i);		if(!(user.getEmail() == null || "".equals(user.getEmail())))		{			emails += user.getEmail() + ";" ;			}	}	aa.print("user emails:: "+emails);	return emails;}//get cap creator email.function getCapCreatorEmail(capID){	var email = "";	var capResult = aa.cap.getCapByPK(capID,true);	if(capResult.getSuccess())	{		var capModel = capResult.getOutput();		var createdByACA = capModel.getCreatedByACA();		var createdBy = capModel.getCreatedBy();		if(createdByACA == "Y")		{			aa.print("capCreatedBy:: " + createdBy);			var publicUser = getPublicUser(createdBy);			if(publicUser != null && publicUser.getEmail() != null)			{					email = publicUser.getEmail() + ";" ;			}		}				if(createdByACA == "N")		{			var sysUser = getSysUserByID(createdBy);			if(sysUser != null && sysUser.getEmail() != null)			{				email = sysUser.getEmail() + ";" ;			}		}	}	else	{		aa.log("**ERROR: Failed to get contact list: " + contactsResult.getErrorMessage());	}	aa.print("cap created email:: " + email);	return email;}//get cap id model.function getCapIDModel()  {	var id1 = aa.env.getValue("PermitId1");	var id2 = aa.env.getValue("PermitId2");	var id3 = aa.env.getValue("PermitId3");		var capResult = aa.cap.getCapID(id1, id2, id3);	if(capResult.getSuccess())		return capResult.getOutput();	else	{		aa.log("**ERROR: Failed to get capId: " + capResult.getErrorMessage());		return null;	}}//get cap address.function getCapAddress(capID){	var addrStr = "";	var addressResult = aa.address.getAddressByCapId(capID,null);	if(addressResult.getSuccess())	{		var addressScripts = addressResult.getOutput();		if(addressScripts != null)		{			for(loopk in addressScripts)			{				var addressScript = addressScripts[loopk];				var addressModel = addressScript.getAddressModel();				addrStr += " " + addressModel.toString();			}		}	}	aa.print("cap address:: " + addrStr);	return addrStr;}//get system user information.function getSysUserByID(userId){	aa.print("SysUserID:: " + userId);	var inspector = null;	if(userId != null)	{		var inspectorResult = aa.people.getSysUserByID(userId);		if(inspectorResult.getSuccess())		{			inspector = inspectorResult.getOutput();		}	}		return inspector;}//get user info , the info will be used for email,function getPublicUser(userSeqNbr){	//replace "PUBLICUSER"	if(userSeqNbr.indexOf("PUBLICUSER") != -1)	{		userSeqNbr = userSeqNbr.substr(10);	}	aa.print("userSeqNbr:: "+ userSeqNbr);	var userNbr = aa.util.parseLong(userSeqNbr);	var s_result = aa.publicUser.getPublicUser(userNbr);	var publicUser = null;	if(s_result.getSuccess())	{		publicUser = s_result.getOutput();		if (publicUser == null)		{			aa.log('ERROR: no User on this userSeqNum:' + user);		 	publicUser = null;		}	}	else	{	  	aa.log('ERROR: Failed to User: ' + s_result.getErrorMessage());	  	publicUser = null;   	}		return publicUser;}//send email.function sendEmail(mailTO, mailFROM, mailCC, inspModel, actModel, inspector, capID){	aa.print("mailTO:: " + mailTO);	aa.print("mailFROM:: " + mailFROM);	aa.print("mailCC:: " + mailCC);	aa.print("inspType:: " + inspModel.getInspectionType());	aa.print("inspStatus:: " + actModel.getStatus());		var mailcontent = getEmailContent(inspModel, actModel, inspModel.getRequestComment(),inspector, capID);	aa.print("mailcontent:: " + mailcontent);		var mailsuject = getEmailSubject();	aa.print("mailsuject:: " + mailsuject);		var s_result = aa.sendMail(mailFROM, mailTO, mailCC, mailsuject, mailcontent);	if(!s_result.getSuccess())	{		aa.log('Message: notice eamil send faild!');		return false;	}		return true;	aa.log('Message: notice eamil send successful!');}//get email content.function getEmailContent(inspModel, actModel, reqCommentModel,inspector, capID){	var servProvCode = capID.getServiceProviderCode();		var pamaremeters = aa.util.newHashtable();		var inspFullName = "";	if(inspector != null)	{		if(inspector.getFirstName() != null)		{			inspFullName += inspector.getFirstName() + " ";		}		if(inspector.getMiddleName() != null)		{			inspFullName += inspector.getMiddleName() + " ";		}		if(inspector.getLastName() != null)		{			inspFullName += inspector.getLastName() + " ";		}	}	aa.print("inspFullName:: " + inspFullName);	addParameter(pamaremeters, "$$InspectorFullName$$", inspFullName);	addParameter(pamaremeters, "$$CustomId$$", capID.toKey());	addParameter(pamaremeters, "$$PermitId1$$", capID.getID1());	addParameter(pamaremeters, "$$PermitId2$$", capID.getID2());	addParameter(pamaremeters, "$$PermitId3$$", capID.getID3());		addParameter(pamaremeters, "$$InspectionType$$", inspModel.getInspectionType());	addParameter(pamaremeters, "$$InspectionStatus$$", actModel.getStatus());		var inspDate = inspModel.getActivityDate();	addParameter(pamaremeters, "$$InspectionDate$$", inspDate);		var inspTime = inspModel.getScheduledTime2();	addParameter(pamaremeters, "$$InspectionTime$$", inspTime);		var capAddress = getCapAddress(capID);	addParameter(pamaremeters, "$$InspectionAddress$$", capAddress);		if(reqCommentModel != null)	{		aa.print("Request Comments:: " + reqCommentModel.getText());		addParameter(pamaremeters, "$$RequestedComments$$", reqCommentModel.getText());	}	else	{		addParameter(pamaremeters, "$$RequestedComments$$", "");	}		var emailContent = aa.util.newStringBuffer();	emailContent.append("<meta http-equiv=Content-Type content=text/html; charset=UTF-8>");			var mailcontent = aa.util.getCustomContentByType4InspScheAfter(mailContentType,inspModel, capID,pamaremeters);	emailContent.append(mailcontent);		return emailContent.toString();}//add parameter to map.function addParameter(pamaremeters, key, value){	if(key != null)	{		if(value == null)		{			value = '';		}				pamaremeters.put(key, value);	}}//get email subject.function getEmailSubject(){	var pamaremeters = aa.util.newHashtable();			var mailSubject = aa.util.getCustomContentByType(mailSubjectType, pamaremeters);		if(mailSubject == null)	{		mailSubject = '';	}		return mailSubject;}//to judge inspection status.function checkInspStatus(statusNbr,actModel){	if(statusNbr == null || actModel == null)	{		return false;	}		var sign = false;		//Request Pending.	if(statusNbr == 1)	{		if(INSP_STATUS_PENDING.equals(actModel.getStatus()) && INSP_STATUS_DESC_PENDING.equals(actModel.getDocumentDescription()))		{			sign = true;		}	}	//Schedule.	else if(statusNbr == 2)	{		if(INSP_STATUS_SCHEDULED.equals(actModel.getStatus()) && INSP_STATUS_DESC_SCHEDULED.equals(actModel.getDocumentDescription()))		{			sign = true;		}	}	//Reschedule.	else if(statusNbr == 3)	{		if(INSP_STATUS_RESCHEDULED.equals(actModel.getStatus()) && INSP_STATUS_DESC_RESCHEDULED.equals(actModel.getDocumentDescription()))		{			sign = true;		}	}	//Cancelled.	else if(statusNbr == 4)	{		if(INSP_STATUS_CANCELLED.equals(actModel.getStatus()) && INSP_STATUS_DESC_CANCELLED.equals(actModel.getDocumentDescription()))		{			sign = true;		}	}	//Result Pending.	else if(statusNbr == 5)	{		if(INSP_STATUS_RESULT_PENDING.equals(actModel.getInspResultType()) && INSP_STATUS_DESC_SCHEDULED.equals(actModel.getDocumentDescription()))		{			sign = true;		}	}	//Result Denied.	else if(statusNbr == 6)	{		if(INSP_STATUS_RESULT_DENIED.equals(actModel.getInspResultType()) && INSP_STATUS_DESC_CANCELLED.equals(actModel.getDocumentDescription()))		{			sign = true;		}	}	//Result Approved.	else if(statusNbr == 7)	{		if(INSP_STATUS_RESULT_APPROVED.equals(actModel.getInspResultType()) && INSP_STATUS_DESC_RESULT.equals(actModel.getDocumentDescription()))		{			sign = true;		}	}		return sign;}
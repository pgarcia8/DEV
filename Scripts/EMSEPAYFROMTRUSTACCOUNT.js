 // -------------------------------------------------------------------------------------------------------------// Demon script for payment with trust account.// -------------------------------------------------------------------------------------------------------------var PEOPLE_TYPE_CONTACT = "Contact";var PEOPLE_TYPE_PEOPLE = "Licensed People";var PEOPLE_TYPE_PARCEL = "Parcel";var PEOPLE_TYPE_ADDRESS = "Address";var error = "";var message = "";var br = "<br>";main();if (error && error.length > 0){	aa.env.setValue("ScriptReturnCode", "1");	aa.env.setValue("ScriptReturnMessage", error);}else{	aa.env.setValue("ScriptReturnCode", "0");	aa.env.setValue("ScriptReturnMessage", message);}function main(){	var capID = getCapId();	if (capID == null)	{		logError("ERROR: capID should not be null");		return;	}	var trustAccountType = PEOPLE_TYPE_ADDRESS;	// Fetch the primary trust account list.	// ---------------------------------------	var a_primaryTrustAccounts = null;	var accountResult = aa.trustAccount.getPrimaryTrustAccountID(capID, trustAccountType);	if (accountResult.getSuccess())	{		a_primaryTrustAccounts = accountResult.getOutput();	}	else	{		logError("ERROR: Failed to get trust account: " + accountResult.getErrorMessage());		return;	}		if (a_primaryTrustAccounts == null || a_primaryTrustAccounts.size() == 0)	{		logError("ERROR: None available trust account can be found!");		return;	}	logMessage("Primary trust account size: " + a_primaryTrustAccounts.size());	// Using the first account for payment.	// ----------------------------------------	var chargeAccount = a_primaryTrustAccounts.get(0);	logMessage("Primary trust acount: " + chargeAccount);	var payment = initPayment(capID, chargeAccount);	var paymentSeq = null;	var paymentResult = aa.finance.makePayment(payment);	if (paymentResult.getSuccess())	{		paymentSeq = paymentResult.getOutput();	}	else	{		logError("ERROR: Failed to do payment: " + paymentResult.getErrorMessage());		return;	}	logMessage("Payment successful, payment SEQ: " + paymentSeq);}function initPayment(capID, chargeAccount){	var paymentAmount = 1.0	var paymentDate = aa.date.getCurrentDate();	var callerID = aa.env.getValue("CurrentUserID");	var payment = aa.finance.createPaymentScriptModel();	payment.setCapID(capID);	payment.setAmountNotAllocated(paymentAmount);	payment.setAuditID(callerID);	payment.setCashierID(callerID);	payment.setPaymentAmount(paymentAmount);	payment.setPaymentDate(paymentDate);	payment.setPaymentMethod("Trust Account");	payment.setAcctID(chargeAccount);	payment.setPaymentStatus("Paid");	payment.setSessionNbr(0);	return payment;}function getCapId(){	var s_id1 = "08008" ;	var s_id2 = "00000" ;	var s_id3 = "00043" ;	var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);	if(s_capResult.getSuccess())	{		return s_capResult.getOutput();	}	else	{		logError("ERROR: Failed to get capId: " + s_capResult.getErrorMessage());		return null;	}}function logError(str){	error += str + br;}function logMessage(str){	message += str + br;}
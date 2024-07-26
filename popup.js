// PureGarden Text Popup script
// extension functions
// get active tab, send message to content scripts, report errors

function getJobData(){
	// request data from content script
	browser.tabs.query({active: true, currentWindow: true}).then(sendMessage).catch(onError);
}

// send message to content script and receive job data
function sendMessage(tabs){
	browser.tabs.sendMessage(tabs[0].id, {command: "getjob"}).then(handleResponse).catch(onError);
}

function onError(error){
	console.log(error);
}

// parse job data and populate popup form
function handleResponse(response){
	var job = JSON.parse(response.contents);
	populatePopup(job);
}

// fill popup form with job data
function populatePopup(job) {
    getAPIKey();
    document.getElementById("main").classList.remove("hidden");
    document.getElementById("title").innerText = null;
    document.getElementById("phone").value = job.phone_number;
	document.getElementById("recipientPhoneNumber").innerText = `Sending to: ${job.phone_number}`;

    // Generate text message content
    var textMessageContent = `Hello,\n\n Your order from ${job.customer} (${job.do_number}), has now been scheduled to arrive on ${job.date} between ${job.time_window}.\n\nThanks,\nService Team`;

    // Update text message field in the popup
    document.getElementById("textMessageContent").innerText = textMessageContent;

    // Log the text message content to the console for debugging
    console.log("Text Message Content: ", textMessageContent);
}



function sendJobToText() {
    console.log("Sending job to text...");
    const from = "ServiceTeam";
    const to = document.getElementById("phone").value;
    const text = document.getElementById("textMessageContent").innerText;
    const apiKey ="7aac93aa"; 
    const apiSecret = document.getElementById("apiSecret").value;
    if (apiSecret === undefined || apiSecret === "" || apiSecret === "undefined"){
		showAPISecretField();
		return;
	}
	setAPIKey();

    document.getElementById("main").classList.add("hidden");
    document.getElementById("sending").classList.remove("hidden");

    browser.runtime.sendMessage({
        type: "sendJobToText",
        apiKey,
        apiSecret,
        to,
        from,
        text
    }).then((response) => {
        console.log("Received response from background script:", response);
        const { messages } = response;
        if (response && response.messages && response.messages.length > 0) {
            const { status } = response.messages[0];
            const statusTest = response.messages[0].status;
            const errorText = response.messages[0]['error-text'];
            console.log(`Status: ${statusTest}`);
            console.log(`Error Text: ${errorText}`);
            
            if (status === "0") {
                console.log('Message sent to Vonage successfully');
                document.getElementById("sendingText").classList.add("hidden");
                document.getElementById("sendingResponse").classList.remove("hidden");
                document.getElementById("tick").classList.remove("hidden");
                document.getElementById("message").innerText = "Message Sent";
            } else {
                console.log(`Message failed with error: ${response.messages[0]['error-text']}`);
                document.getElementById("sendingText").classList.add("hidden");
                document.getElementById("sendingResponse").classList.remove("hidden");
                document.getElementById("cross").classList.remove("hidden");
                document.getElementById("message").innerText = `Error: ${response.messages[0]['error-text']}`;
            }
        } else {
            console.error('Unexpected response format:', response);
            document.getElementById("sendingText").classList.add("hidden");
            document.getElementById("sendingResponse").classList.remove("hidden");
            document.getElementById("cross").classList.remove("hidden");
            document.getElementById("message").innerText = `Error: ${response.messages[0]['error-text']}`;
        }
    }).catch((error) => {
        console.error('Error sending message:', error);
        document.getElementById("main").classList.remove("hidden");
        document.getElementById("sending").classList.add("hidden");
        document.getElementById("sendingText").classList.add("hidden");
        document.getElementById("sendingResponse").classList.remove("hidden");
        document.getElementById("cross").classList.remove("hidden");
        document.getElementById("message").innerText = `Error: ${response.messages[0]['error-text']}`;
    });
}



// populate job model from form data and return
function getJobModel(){
	var job = {};

	let pgno = document.getElementById("pgno").value;
	job.do_number = pgno;

	let orderno = document.getElementById("orderno").value;
	job.order_number = orderno;

	let date = document.getElementById("jobdate").value;
	job.date = new Date(date).toISOString();

	let time = document.getElementById("jobtime").value;
	job.job_time = time;
	job.time_window = time;

	let cust = document.getElementById("customer").value;
	job.customer = cust;

	let phone = document.getElementById("phone").value;
	job.phone_number = phone;

	let address = document.getElementById("address").value;
	job.address = address;

	return job;
}


// show input field for API key
function showAPISecretField(){
	document.getElementById("apiSecret").value = "";
	document.getElementById("apiSecret").classList.remove("hidden");

    const row = apiSecret.parentElement;
    row.style.marginBottom = "20px"; // Adjust margin bottom when API secret input is displayed
   
    const input = row.querySelector("input");
    input.style.marginTop = "4px"; // Adjust margin top for input when API secret input is displayed
    input.style.padding = "5px"; // Add padding for input when API secret input is displayed
}

// gets API key input value and stores it locally to the browser
function setAPIKey(){
	var val = document.getElementById("apiSecret").value;
	browser.storage.local.set({"apiSecretText": val});
}

// gets API key from local browser storage and updates the "hidden" input field
function getAPIKey(){
	browser.storage.local.get("apiSecretText").then(function(val){ document.getElementById("apiSecret").value = val.apiSecretText; });
}

// Update recipient phone number display
function updateRecipientPhoneNumber() {
    const phoneInput = document.getElementById("phone");
    let sanitizedValue = phoneInput.value.replace(/\D/g, ''); // Remove non-numeric characters
    phoneInput.value = sanitizedValue; // Update input value to contain only numbers
    document.getElementById("recipientPhoneNumber").innerText = `Sending to: ${sanitizedValue}`;
}

// assign handler for submit
document.querySelectorAll("button")[0].addEventListener("click", sendJobToText);

// Add event listener for phone number input field after DOM is loaded
document.addEventListener("DOMContentLoaded", function() {
    const phoneInput = document.getElementById("phone");
    if (phoneInput) {
        phoneInput.addEventListener("input", updateRecipientPhoneNumber);
    } else {
        console.error("Element with ID 'phone' not found.");
    }
});

// assign handler for submit
document.querySelectorAll("button")[0].addEventListener("click", sendJobToText);

// get job data on popup load
getJobData();
// PureGarden Text content script
// Extension added to Firefox (could port to Chrome if requested)
// Click extension icon, display a form populated with data from jobModel
// Fields modifiable via pop up form
// Button to send to Detrack (requires API token)

// init empty job model
var jobModel = {
	type: "Delivery",
	do_number: undefined, // pg no
	order_number: undefined, // customer order no
	date: undefined,
	time_window: undefined,
	job_time: undefined,
	address: undefined,
    customer: undefined,
	phone_number: undefined,
};

// scrape job info from page and assign to job model
function pullJobData(){
	let job = Object.assign({}, jobModel);
	

	job.do_number = getDoNumber();

	job.date = getScheduledDate();

	job.time_window = getDeliveryTime();
	job.job_time = job.time_window.substr(0, 5);

	job.address = getAddress();

	job.phone_number = getPhone();
	
	job.customer = getJobCustomerName();

	job.order_number = getOrderNumber();

	return job;
}

// scrape PG Number (do_number)
function getDoNumber(){
	try {
		let pg = document.querySelector("#post_job_form .we-page-label-value").innerText;
		return pg;
	} catch(e){
		return undefined;
	}
}

// scrape scheduled date (date)
function getScheduledDate() {
    try {
        // Find the input element with id "job-schedule-time"
        let scheduledDateInput = document.getElementById("job-schedule-time");
        console.log("scheduledDateInput:", scheduledDateInput);

        let dateErrorElement = document.getElementById("error");
        console.log("dateErrorElement: ", dateErrorElement);

        // Check if the input element exists
        if (scheduledDateInput) {
            // Get the value of the input element
            let dateStr = scheduledDateInput.value;
            console.log("dateStr:", dateStr);

            // Extract only the date part
            let dateOnly = dateStr.split(" - ")[0];
            console.log("dateOnly:", dateOnly);

            // Return the date string
            return dateOnly;
        } else {
            // If the input element is not found, return "No date found"
            dateErrorElement.textContent = "Please enter a valid date";
            console.log("Scheduled date input element not found");
            return "No date found";
        }
    } catch (e) {
        // Handle any errors and return an empty string
        console.error("Error:", e);
        return "";
    }
}


// scrape delivery time window (job_time and time_window)
function getDeliveryTime() {
    try {
        let cache = document.getElementById("job-schedule-time");
        console.log("Cache element:", cache);

        // Navigate to the 'Scheduled date' span element using previousElementSibling
        let endTimeElement = cache.previousElementSibling;
        console.log("End time element:", endTimeElement);
        
        let startTimeElement = endTimeElement.previousElementSibling.previousElementSibling;
        console.log("Start time element:", startTimeElement);
        
        // Extract start and end times
        let st = startTimeElement.textContent.trim().split(" - ")[1];
        let et = endTimeElement.textContent.trim().split(" - ")[1];
        
        console.log("Start time:", st);
        console.log("End time:", et);

        let timeStr = st + " - " + et;
        console.log("Time string:", timeStr);
        
        return timeStr;
    } catch (e) {
        console.error("Error:", e.message);
        return "";
    }
}

// Scrape all address lines and combine them into a single address string
function getAddress() {
    try {
        let addressLines = [];
        let addressElements = document.querySelectorAll("#post_job_form td.align-vertial-top div.full-width.we-page-label-value.address");

        addressElements.forEach(element => {
            let addressLine = element.textContent.trim();
            addressLines.push(addressLine);
        });

        let address = addressLines.join(' ');
        return address;
    } catch (e) {
        console.error("Error in getAddress:", e.message);
        return "";
    }
}

// scrape customer's phone number (phone_number)
function getPhone(){
    try {
        let phone = document.querySelector("#post_job_form a[href^='tel:']");
        console.log("Phone Element:", phone); // Log the phone element
        if (phone) {
            let phoneText = phone.textContent.trim();
            console.log("Phone Text:", phoneText); // Log the phone text
            let phoneNumber = phoneText.match(/\d+/g); // Match any sequence of digits
            console.log("Matched Phone Number:", phoneNumber); // Log the matched phone number
            if (phoneNumber) {
                // Join the matched digits to form the phone number
                let formattedNumber = phoneNumber.join("").replace(/^0/, "44"); // Replace leading '0' with '44'
                console.log("Formatted Phone Number:", formattedNumber); // Log the formatted phone number
                return formattedNumber;
            } else {
                return "";
            }
        } else {
            return "";
        }
    } catch(e){
        console.error("Error:", e); // Log any errors that occur
        return "";
    }
}


// scrape job customer name (customer)
function getJobCustomerName() {
    try {
        let jobCustomer = document.getElementById("customerName").innerText;
        console.log('Customer:', jobCustomer);
        return jobCustomer;
    } catch (e) { 
        console.error('Error fetching customer name:', e);
        return ""; 
    }   
}


function getOrderNumber(){
    try {
        // Get the order number element
        let orderNumberElement = document.querySelector("#name");

        // Check if the element exists
        if (orderNumberElement) {
            // Extract the order number text
            let orderNumber = orderNumberElement.innerText.trim();

            // Return the extracted order number
            return orderNumber;
        } else {
            // If the element is not found, return an error message
            return "Order number element not found";
        }
    } catch (e) { 
        // If an error occurs during the process, return the error message
        return e.message;
    }
}


// extension messaging event handler
function receiveMessage(message){
	switch(message.command){
		case "getjob":
			var str = JSON.stringify(pullJobData());
			return Promise.resolve({contents: str});
	}
}

// trigger handler on message received
browser.runtime.onMessage.addListener(receiveMessage);
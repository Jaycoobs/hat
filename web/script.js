let views =
	["hat-selection",
	 "new-hat-menu",
	 "action-selection"];

let hat_list = document.getElementById("hat-list");
let selected_hat = document.getElementById("selected-hat");
let new_hat_button = document.getElementById("new-hat-button");
let back_button = document.getElementById("back-button");
let create_hat_button = document.getElementById("create-hat-button");
let new_hat_name = document.getElementById("new-hat-name");
let create_error_text = document.getElementById("create-error-text");
let submit_button = document.getElementById("submit-button");
let submit_text = document.getElementById("submit-text");
let submit_error_text = document.getElementById("submit-error-text");
let draw_button = document.getElementById("draw-button");

function set_view(view) {
	for (v of views.map((v) => { return document.getElementById(v);}))
		v.classList.add("hidden");
	document.getElementById(view).classList.remove("hidden");
}

function create_hat_list_entry(hat_name) {
	let li = document.createElement("li");
	let p = document.createElement("p");

	li.appendChild(p);
	p.textContent = hat_name;

	p.onclick = (e) => { hat_selected(hat_name); };

	hat_list.appendChild(li);
}

function request_hats() {
	hat_list.innerHTML = "";
	fetch(window.location.origin + "/api/hats")
		.then((r) => {return r.json()})
		.then(build_hats_list)
		.catch((e) => {
			console.error("Failed to fetch hat list: " + e);
		});
}

function build_hats_list(data) {
	for (hat of data) {
		create_hat_list_entry(hat);
	}
}

function hat_selected(hat_name) {
	selected_hat.textContent = hat_name;
	set_view("action-selection");
}

function create_error(message) {
	create_error_text.textContent = "FAILED TO CREATE HAT: " + message;
	setTimeout(() => { create_error_text.textContent = ""; }, 4000);
}

function submit_error(message) {
	submit_error_text.textContent = "FAILED TO SUBMIT ENTRY: " + message;
	setTimeout(() => { submit_error_text.textContent = ""; }, 4000);
}

function draw_error(message) {
	submit_error_text.textContent = "FAILED TO DRAW: " + message;
	setTimeout(() => { submit_error_text.textContent = ""; }, 4000);
}

[... document.getElementsByClassName("back")].forEach((b) => {
	b.onclick = (e) => {
		set_view("hat-selection");
	}
});

new_hat_button.onclick = (e) => {
	set_view("new-hat-menu");
}

create_hat_button.onclick = (e) => {
	fetch(window.location.origin + "/api/create-hat", {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: `"${new_hat_name.value}"`,
	}).then((response) => {
		if (!response.ok) {
			response.text().then(create_error);
			return;
		}
		selected_hat.textContent = new_hat_name.value;
		new_hat_name.value = "";
		set_view("action-selection");
		request_hats();
	}).catch((error) => {
		create_error(error);
	});
}

submit_button.onclick = (e) => {
	fetch(window.location.origin + "/api/submit", {
		method: 'POST',
		headers: {
			'Accept': 'application/json',
			'Content-Type': 'application/json'
		},
		body: `{
			"hat": "${selected_hat.textContent}",
			"entry": "${submit_text.value}"
		}`,
	}).then((response) => {
		if (!response.ok) {
			response.text().then(submit_error);
			return;
		}
		submit_error_text.textContent = "ENTRY RECORDED!";
		submit_text.value = "";
		setTimeout(() => {
			submit_error_text.textContent = "";
		}, 2000);
	}).catch((error) => {
		submit_error(error);
	});
}

draw_button.onclick = (e) => {
	fetch(window.location.origin + `/api/draw/${selected_hat.textContent}`)
		.then((response) => {
			if (!response.ok) {
				response.text().then(draw_error);
				return;
			}
			return response.json()
		}).then((response) => {
			if (!response)
				return;

			submit_error_text.textContent = response.entry;
		})
}

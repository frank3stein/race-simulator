
let store = {
	tracks: null,
	racers: null,
	track_id: null,
	player_id: null,
	race_id: null,
};
// We need our javascript to wait until the DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
	onPageLoad();
	setupClickHandlers();
});

function updateStore(updates, cb) {
	store = {
		...store,
		...updates,
	};

	if (cb) {
		return cb(store);
	}

	return store;
}

async function onPageLoad() {
	const page = window.location.href.split("/").pop();

	if (page === "race") {

		await Promise.all([
			getTracks()
				.then((tracks) => tracks.json())
				.then((tracks) => {
					updateStore(
						{
							tracks,
						},
						console.log
					);
					const html = renderTrackCards(tracks);
					renderAt("#tracks", html);
				}).catch(err => console.error("GetTracks error: ", err)),
			getRacers()
				.then((racers) => racers.json())
				.then((racers) => {
					updateStore(
						{
							racers,
						},
						console.log
					);
					const html = renderRacerCars(racers);
					renderAt("#racers", html);
				}).catch(err => console.error("GetRacers error: ", err)),
		]);
	}


}

function setupClickHandlers() {
	document.addEventListener(
		"click",
		function (event) {
			// I am leaving this part as comments, the reason I implemented this was, in the code provided, the selection occurs if you only click on the specific parts of the buttons. The reason for that since there are several elements in the clickable race name and driver name, you have to click on the element that has the class.

			// I tried to solve this issue by using the path, it gives an array of elements that the event bubbles through. You can check if the element with the class we are looking for was visited or not. Since bubbling occurs from inside to outside, we are more likely to never run the loop fully and find the element that we want. This in theory should enable you to click on any area on the names


			// 	const { target } = event;

			// 	// Submit create race form
			// 	if (target.matches("#submit-create-race")) {
			// 		event.preventDefault();
			// 		race();
			// 		return;
			// 	}
			// 	// Handle acceleration click
			// 	if (target.matches("#gas-peddle")) {
			// 		handleAccelerate(store.race_id - 1);
			// 	}

			// 	for (let i = 0; i < event.path.length; i++) {
			// 		if (event.path[i].matches === undefined) {
			// 			return
			// 		}
			// 		if (event.path[i].matches([".card.track"])) {
			// 			handleSelectTrack(event.path[i]);
			// 			break;
			// 		}

			// 		// Podracer form field
			// 		if (event.path[i].matches(".card.podracer")) {
			// 			handleSelectPodRacer(event.path[i]);
			// 			break;
			// 		}
			// 	}
			// },

			const { target } = event
			console.log("Event path", event.path)
			// Race track form field
			if (target.matches('.card.track')) {
				handleSelectTrack(target)
			}

			// Podracer form field
			if (target.matches('.card.podracer')) {
				handleSelectPodRacer(target)
			}

			// Submit create race form
			if (target.matches('#submit-create-race')) {
				event.preventDefault()

				// start race
				handleCreateRace()
			}

			// Handle acceleration click
			if (target.matches('#gas-peddle')) {
				handleAccelerate(store.race_id - 1) // instead of target, race id is passed in
			}

		},
		false
	);
}

async function delay(ms) {
	return await new Promise((resolve) => setTimeout(resolve, ms));
}

async function handleCreateRace() {
	const { player_id, track_id } = store;
	renderAt("#race", renderRaceStartView(track_id));

	try {
		const newRace = await createRace(player_id, track_id)
		updateStore({
			race_id: +newRace.ID
		}, console.log)

		await runCountdown(3)
		await startRace(store.race_id - 1) // there is a bug, since the race id starts from 1 and it checks the race by using, races[race_id], it is out of bounds
		await runRace(store.race_id - 1)
	} catch (err) {
		console.error(err)
	}


}
async function runCountdown(timer) {
	await delay(1000);

	return new Promise((resolve) => {

		const countdown = setInterval(() => {
			// run this DOM manipulation to decrement the countdown for the user
			document.getElementById("big-numbers").innerHTML = --timer;
			if (timer <= 0) {
				clearInterval(countdown);
				resolve()
			}
		}, 1000)


	});
}

async function runRace(raceID) {
	return new Promise((resolve) => {
		const showMustGoOn = setInterval(async () => {
			try {
				const raceStats = await getRace(raceID)


				if (raceStats.status === 'in-progress') {
					renderAt('#leaderBoard', raceProgress(raceStats.positions))
				}
				if (raceStats.status === 'finished') {
					clearInterval(showMustGoOn)
					renderAt('#race', resultsView(raceStats.positions)) // to render the results view
					resolve(raceStats) // resolve the promise
				}
			} catch (err) {
				console.error("raceStats error: ", err)
			}
		}, 500)
	});
}

function handleSelectPodRacer(target) {
	console.log("selected a pod", target);

	// remove class selected from all racer options
	const selected = document.querySelector("#racers .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// add class selected to current target
	target.classList.add("selected");

	updateStore(
		{
			player_id: +target.id,
		},
		console.log
	);
}

function handleSelectTrack(target) {
	console.log("selected a track", target.innerText);

	// remove class selected from all track options
	const selected = document.querySelector("#tracks .selected");
	if (selected) {
		selected.classList.remove("selected");
	}

	// add class selected to current target
	target.classList.add("selected");
	updateStore(
		{
			track_id: target.innerText, // since track property is string in /api/races endpoint I am using the name of the track here. I am not sure which one is expected. id int value as string or name value ?
		},
		console.log
	);
}

async function handleAccelerate(id) {
	console.log("accelerate button clicked ", id);
	try {

		await accelerate(id)
	} catch (err) {
		console.error("Accelerate ", err)
	}
}

function renderRacerCars(racers) {
	if (!racers.length) {
		return `
			<h4>Loading Racers...</4>
		`;
	}

	const results = racers.map(renderRacerCard).join("");
	return `
		<ul id="racers">
			${results}
		</ul>
	`;
}

function renderRacerCard(racer) {
	const { id, driver_name, top_speed, acceleration, handling } = racer;
	return `
		<li class="card podracer" id="${id}">
			<h3>${driver_name}</h3>
			<p>${top_speed}</p>
			<p>${acceleration}</p>
			<p>${handling}</p>
		</li>
	`;
}

function renderTrackCards(tracks) {
	if (!tracks.length) {
		return `
			<h4>Loading Tracks...</4>
		`;
	}

	const results = tracks.map(renderTrackCard).join("");

	return `
		<ul id="tracks">
			${results}
		</ul>
	`;
}

function renderTrackCard(track) {
	const { id, name } = track;

	return `
		<li id="${id}" class="card track">
			<h3>${name}</h3>
		</li>
	`;
}

function renderCountdown(count) {
	return `
		h2>Race Starts In...</h2>
		<p id="big-numbers">${count}</p>
	`;
}

function renderRaceStartView(track, racers) {
	return `
		<header>
			<h1>Race: ${track.name}</h1>
		</header>
		<main id="two-columns">
			<section id="leaderBoard">
				${renderCountdown(3)}
			</section>

			<section id="accelerate">
				<h2>Directions</h2>
				<p>Click the button as fast as you can to make your racer go faster!</p>
				<button id="gas-peddle">Click Me To Win!</button>
			</section>
		</main>
		<footer></footer>
	`;
}

function resultsView(positions) {
	positions.sort((a, b) => (a.final_position > b.final_position ? 1 : -1));

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			${raceProgress(positions)}
			<a href="/race">Start a new race</a>
		</main>
	`;
}

function raceProgress(positions) {
	let userPlayer = positions.find((e) => e.id === store.player_id);
	userPlayer.driver_name += " (you)";

	const results = positions.map((p) => {
		return `
			<tr>
				<td>
					<h3>${p.final_position ? p.final_position : '...'} - ${p.driver_name}</h3>
				</td>
			</tr>
		`;
	});

	return `
		<header>
			<h1>Race Results</h1>
		</header>
		<main>
			<section id="leaderBoard">
				${results}
			</section>
		</main>
	`;
}

function renderAt(element, html) {
	let node = null;
	console.log(element.match(/^#/));

	if (element.match(/^#/).length) {
		console.log(element.substr(1));
		node = document.getElementById(element.substr(1));
	}

	if (element.match(/^\./) !== null && element.match(/^\./).length) {
		node = document.getElementsByClassName(element.substr(1));
	}
	node.innerHTML = html;
}

const SERVER = "http://localhost:8000";

function defaultFetchOpts() {
	return {
		// otherwise the server does not give any response
		mode: "cors",
		headers: {
			"Content-Type": "application/json",
			"Access-Control-Allow-Origin": SERVER,
		},
	};
}


function getTracks() {
	return fetch(`${SERVER}/api/tracks`, { ...defaultFetchOpts() }).catch(err => console.error("GetTracks error: ", err));;
}

function getRacers() {
	return fetch(`${SERVER}/api/cars`, { ...defaultFetchOpts() }).catch(err => console.error("GetRacers error: ", err));
}

function createRace(player_id, track_id) {
	const body = { player_id, track_id }; // track_id here is the name of the track
	return fetch(`${SERVER}/api/races`, {
		...defaultFetchOpts(),
		headers: {
			'Content-type': 'text/plain'
		},
		method: 'POST',
		dataType: 'jsonp',
		body: JSON.stringify(body)
	}).then(res => res.json()).catch(err => console.error("CreateRace ", err))
}

function getRace(id) {
	return fetch(`${SERVER}/api/races/${id}`).then(res => res.json()).catch(err => console.error("RaceStats: ", err))
}

function startRace(id) {
	return fetch(`${SERVER}/api/races/${id}/start`, {
		...defaultFetchOpts(),
		method: "POST",
	}).catch(err => console.error("StartRace ", err));
}

function accelerate(id) {
	fetch(`${SERVER}/api/races/${id}/accelerate`, {
		...defaultFetchOpts(),
		method: 'POST'
	}).catch(err => console.error("Accelerate ", err))
}

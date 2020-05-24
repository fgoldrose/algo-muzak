const ctx = new (window.AudioContext || window.webkitAudioContext)()
const fft = new AnalyserNode(ctx, { fftSize: 2048 })


function step( rootFreq, steps ) {
    let ratios = [
        1,      // unison ( 1/1 )       // C
        25/24,  // minor second         // C#
        9/8,    // major second         // D
        6/5,    // minor third          // D#
        5/4,    // major third          // E
        4/3,    // fourth               // F
        45/32,  // diminished fifth     // F#
        3/2,    // fifth                // G
        8/5,    // minor sixth          // G#
        5/3,    // major sixth          // A
        9/5,    // minor seventh        // A#
        15/8,   // major seventh        // B
    ]

    if(steps >= ratios.length){
        let octaveShift = Math.floor( steps / ratios.length )
        rootFreq = rootFreq * Math.pow(2,octaveShift)
    }

    let r = steps % ratios.length
    let freq = rootFreq * ratios[r]
    return Math.round(freq*100)/100
}

function tone (type, pitch, time, duration) {
	const t = time || ctx.currentTime
	const dur = duration || 0.25

	const osc = new OscillatorNode(ctx, {type : type || 'sine', frequency: pitch || 440})
	const lvl = new GainNode(ctx, {gain: 0.25})
	osc.connect(lvl)
	lvl.connect(ctx.destination)
	lvl.connect(fft)
	osc.start(t)
	osc.stop(t + dur)

	return [osc, lvl]
}

function melodyRecursively(steps, scale, base_pitch, cur_step, time, depth, notelen, osc, gain) {
	if (depth == 1){
		for (let s = 0; s < steps.length ; s++){
			if (steps[s] == "_"){
				gain.gain.setValueAtTime(0, time + s * notelen)
				gain.gain.setValueAtTime(0.25, time + (s + 1) * notelen)
			}
			else{
			let scale_step = steps[s] + cur_step
			let note_step = scale[scale_step % scale.length] + 12 * Math.floor(scale_step / scale.length)
			osc.frequency.setValueAtTime(step(base_pitch, note_step), time + s*notelen)
		}
		}
	}
	else {
		for (let s = 0; s < steps.length ; s++){
			if (steps[s] == "_"){
				gain.gain.setValueAtTime(0, time + Math.pow(steps.length, depth-1) * notelen * s)
				gain.gain.setValueAtTime(0.25, time + Math.pow(steps.length, depth-1) * notelen * (s+1))
				
			}
			else{
			let scale_step = steps[s] + cur_step
			
			melodyRecursively(steps,
						scale,
						base_pitch,
						scale_step,
						time + Math.pow(steps.length, depth-1) * notelen * s,
						depth-1, 
						notelen,
						osc,
						gain)
		}
		}
	}
}

/*
// wrap around the scale instead of switching octaves
// commented out cause it sounds kinda bad lol
function melodyRecursivelyWrap(steps, scale, base_pitch, cur_step, time, depth, notelen, osc) {
	if (depth == 1){
		for (let s = 0; s < steps.length ; s++){

			let scale_step = steps[s] + cur_step
			let note_step = scale[scale_step % scale.length]
			osc.frequency.setValueAtTime(step(base_pitch, note_step), time + s*notelen)
		
		}
	}
	else {
		for (let s = 0; s < steps.length ; s++){
			let scale_step = steps[s] + cur_step
			let note_step = scale[scale_step % scale.length]
			
			melodyRecursivelyWrap(steps,
						scale,
						base_pitch,
						scale_step,
						time + Math.pow(steps.length, depth-1) * notelen * s,
						depth-1, 
						notelen,
						osc)
		}
	}
}
*/

// easily try specific melodies from the console
function makeWithMel(steps_list, start_step, scale_index, tl, d){
	let scale = scales[scale_index] || scales[0]
	let startFreq = step(110, start_step) || step(110, 0)
	let tonelen = tl || 0.25
	let depth = d || 4

	let starttime = ctx.currentTime

	for(let j = 0; j < steps_list.length; j++){
		let steps = steps_list[j]
		let t = tone('sine', startFreq, starttime, Math.pow(steps.length, depth) * tonelen)
		let osc = t[0]
		let gain = t[1]

		melodyRecursively(steps, scale, startFreq, 0, starttime, depth, tonelen, osc, gain)
	}
}

/*
function makeWithMelWrap(steps_list, start_step, scale_index, d){
	let scale = scales[scale_index] || scales[0]
	let startFreq = step(110, start_step) || step(110, 0)
	let tonelen = tl || 0.15
	let depth = d || 4

	for(let j = 0; j < steps_list.length; j++){
		let steps = steps_list[j]
		let osc = tone('sine', startFreq, ctx.currentTime, Math.pow(steps.length, depth) * tonelen)

		melodyRecursivelyWrap(steps, scale, startFreq, 0, ctx.currentTime, depth, tonelen, osc)
	}
}
*/

// play the melodies slower once
function testMel(steps_list, start_step, scale_index, tl){
	let scale = scales[scale_index] || scales[0]
	let startFreq = step(110, start_step) || step(110, 0)
	let tonelen = tl || 0.5

	for(let j = 0; j < steps_list.length; j++){
		let steps = steps_list[j]
		let t = tone('sine', startFreq, ctx.currentTime, steps.length * tonelen)
		let osc = t[0]
		let gain = t[1]

		melodyRecursively(steps, scale, startFreq, 0, ctx.currentTime, 1, tonelen, osc, gain)
	}
}

/*
function testMelWrap(steps_list, start_step, scale_index, tl){
	let scale = scales[scale_index] || scales[0]
	let startFreq = step(110, start_step) || step(110, 0)
	let tonelen = tl || 0.5

	for(let j = 0; j < steps_list.length; j++){
		let steps = steps_list[j]
		let osc = tone('sine', startFreq, ctx.currentTime, Math.pow(steps.length, 4) * tonelen)

		melodyRecursivelyWrap(steps, scale, startFreq, 0, ctx.currentTime, 1, tonelen, osc)
	}
}
*/

const scales =
[[ 0, 2, 4, 5, 7, 9, 11 ],
[0, 2, 3, 5, 7, 8, 10]
]


createWaveCanvas({ element: 'section', analyser: fft })

document.getElementById('stop').addEventListener('click', function() {
	location.reload()
})

document.getElementById('start').addEventListener('click', function() {
	ctx.resume()

	let scale_index = Math.floor(Math.random() * scales.length)
	let start_step = Math.floor(Math.random() * 12)
	let depth = document.getElementById('depth').value || 4
	console.log(scale_index, start_step)

	let numMelodies = document.getElementById('melodies').value || 1
	let notesInMel = document.getElementById('notes').value || 4

	let melodies = []

	for(let j = 0; j < numMelodies; j++){
		let melody = []
		for(let i= 0; i < notesInMel; i++){
			if (Math.random() < 0.1){
				melody.push("_")
			}
			else if (i > 0 && Math.random() < 0.1){ // increased chance of repeated notes
				melody.push(melody.slice(-1)[0])
			}
			else if (j > 0 && Math.random() < 0.1){ // increased chance of same notes btwn melodies
				melody.push(melodies.slice(-1)[0].slice(j)[0])
			}
			else{
				let step = Math.floor(Math.random() * 8)
				melody.push(step)
			}

		}
		console.log('melody', melody)
		melodies.push(melody)
	}

		makeWithMel(melodies, start_step, scale_index, 0.25, depth)

})

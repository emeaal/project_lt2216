import { MachineConfig, send, Action, assign } from "xstate";
import bg from "./forest.png"

const sayPlace: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `You're right. It does seem to be a ${context.recResult[0].utterance}` // not needed
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

function sayp(text:string): MachineConfig<SDSContext, any, SDSEvent> {
    return({
        initial: 'saytheplace',
        states: {
            saytheplace: {
                entry: sayPlace,
                on: { ENDSPEECH: 'backgroundChanger' },
            },
            backgroundChanger: {
                entry: ['changeBackground'],
                always: '#root.dm.voicegameapp.forest'
            },
        }
    })
}

const menugrammar: { [index: string]: { beach?: string, forest?: string, help?: string, right?: string, left?:string } } = {
    "It's a beach.": {beach: "Beach" },
    "A beach": {beach: "Beach"},
    "A forest": {forest: "Forest" },
    "Forest.": {forest: "Forest" },
    "It's a forest.": {forest: "Forest" },
    "Help.": {help: "Help" },
    "Right.": {right: "Right" },
    "Right?": {right: "Right" },
    "Left.": {left: "Left" },
}

const img_grammar: {[index: string]: {forest?: any}} = {
    "Forest.": {forest: bg}//new URL('https://nordicforestresearch.org/wp-content/uploads/2020/05/forest-4181023_1280.jpg')}
}

function prompt(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: { prompt: { entry: say(prompt) } }
    })
}


function promptAndAsk(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: say(prompt),
                on: { ENDSPEECH: 'ask' }
            },
            ask: { entry: send('LISTEN') }
        }
    })
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    states: {
        idle: {
            on: {
                CLICK: 'init'
            }
        },
        init: {
            on: {
                TTS_READY: 'voicegameapp',
                CLICK: 'voicegameapp'
            }
        },
        getHelp: {
            initial: 'helpmessage',
            states: {
                helpmessage: {
                    entry: say("One thing that we actually have succeeded to implement at this moment is this help message"),
                    on: { ENDSPEECH: '#root.dm.voicegameapp'},
                }
            }
        },
        voicegameapp: {
            initial: 'welcome',
            states: {
                hist: {
                    type: 'history',
                },
            stop: {
                entry: say("Ok"),
                always: '#root.dm.idle'
            },
            welcome: {
                initial: 'prompt',
                on: {
                    RECOGNISED: [
                        {
                            target: 'forest',
                            cond: (context) => "forest" in (menugrammar[context.recResult[0].utterance] || {}),
                            actions: assign({ forest: (context) => img_grammar[context.recResult[0].utterance].forest!})
                        },
                        {   target: '#root.dm.getHelp',
                            cond: (context) => "help" in (menugrammar[context.recResult[0].utterance] || {})
                        },
                        {
                            target: '.nomatch'
                        }
                    ],
                    TIMEOUT: '..',
                },
                states: {
                    nomatch: {
                        entry: say("Sorry, what did you say?"),
                        on: { ENDSPEECH: 'ask' }
                    },
                },
                ...promptAndAsk("Welcome!"), //You wake up and find yourself in a strange place. But you can't quite tell where. I think you have something in your eyes. Could it be a forest…or more like a beach? What do you think?
            },
            forest: {
                initial: 'sayforest',
                on: {
                    RECOGNISED: [
                        {   target: '#root.dm.getHelp',
                            cond: (context) => "help" in (menugrammar[context.recResult[0].utterance] || {})
                        },
                        {
                            target: 'right_cave',
                            cond: (context) => "right" in (menugrammar[context.recResult[0].utterance] || {}),
                        },
                        {
                            target: 'left_river',
                            cond: (context) => "left" in (menugrammar[context.recResult[0].utterance] || {}),
                        },
                        {
                            target: '.nomatch'
                        }
                    ]
                },
                states: {
                    nomatch: {
                        entry: say("Sorry, what did you say?"),
                        on: { ENDSPEECH: 'ask' }
                    },
                },
                ...sayp("Forest"), 
                ...promptAndAsk("To your right there seems to be a river flowing, and to the left you see what looks like a cave. Where would you like to go?")
            },
            right_cave: {
            ...prompt("You get hit in the head with a bat. You're now dead. Turns out, the one you talked to was the second in command. The older brother wants people to recognise he's in charge and you upset him. Too bad.")
        },
        left_river: {
            ...prompt("What's up?")
        }
    },
},
    },
})

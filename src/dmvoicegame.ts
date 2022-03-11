import { MachineConfig, send, Action } from "xstate";


const sayPlace: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Going to the ${context.recResult[0].utterance}` // not needed
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

const menugrammar: { [index: string]: { beach?: string, forest?: string, help?: string } } = {
    "It's a beach.": {beach: "Beach" },
    "A beach": {beach: "Beach"},
    "A forest": {forest: "Forest" },
    "Forest.": {forest: "Forest" },
    "It's a forest.": {forest: "Forest" },
    "Help.": {help: "Help" } }

function promptAndAsk(promptEvent: Action<SDSContext, SDSEvent>): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: promptEvent,
                on: { ENDSPEECH: 'ask' }
            },
            ask: {
                entry: send('LISTEN'),
            },
            nomatch: { entry: [say("Try again")],  
                       on: { ENDSPEECH: "prompt" } 
            },
        }
    })
}

function prompt(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: { prompt: { entry: say(prompt) } }
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
                        {   target: 'repaint',
                            cond: (context) => "forest" in (menugrammar[context.recResult[0].utterance] || {})
                        },
                        {   target: '#root.dm.getHelp',
                            cond: (context) => "help" in (menugrammar[context.recResult[0].utterance] || {})
                        },
                    ],
                    TIMEOUT: '..',
                },
                states: {
                    prompt: {
                        entry: say("Welcome!"), //You wake up and find yourself in a strange place. But you can't quite tell where. I think you have something in your eyes. Could it be a forest…or more like a beach? What do you think?
                        on: { ENDSPEECH: 'ask' }
                    },
                    ask: {
                        entry: send('LISTEN'),
                    },
                }
            },
            repaint: {
                initial: 'prompt',
                states: {
                    prompt: {
                        entry: sayPlace,
                        on: { ENDSPEECH: 'repaint' }
                    },
                    repaint: {
                        entry: 'changeColour',
                        always: '#root.dm.idle'
                    }
                }
            },
            forest: {
                initial: 'prompt',
                on: {
                    RECOGNISED: [
                        {   target: '#root.dm.init',
                            cond: (context) => "help" in (menugrammar[context.recResult[0].utterance] || {})},
                    ],
                    TIMEOUT: '..',
                },
                ...promptAndAsk( say('This is a test') )
            },
        },
    },
}
})

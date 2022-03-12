import { MachineConfig, send, Action, assign } from "xstate";
import imggg from "forest.png"

const sayPlace: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `Going to the ${context.recResult[0].utterance}` // not needed
}))

function say(text: string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text }))
}

export type TodosContextState = {
    todos: string[];
    addTodo: (name: string) => void;
  };

const img_grammar: {[index: string]: {forest?: any}} = {
    "Forest.": {forest: new URL('https://nordicforestresearch.org/wp-content/uploads/2020/05/forest-4181023_1280.jpg')}
}

const menugrammar: { [index: string]: { beach?: string, forest?: string, help?: string } } = {
    "It's a beach.": {beach: "Beach" },
    "A beach": {beach: "Beach"},
    "A forest": {forest: "Forest" },
    "Forest.": {forest: "Forest" },
    "It's a forest.": {forest: "Forest" },
    "Help.": {help: "Help" } 
}

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
                            cond: (context) => "forest" in (menugrammar[context.recResult[0].utterance] || {}),
                            actions: assign({forest: (context) => menugrammar[context.recResult[0].utterance].forest!})
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
                        on: { ENDSPEECH: 'backgroundChanger' }
                    },
                    backgroundChanger: {
                        entry: ['changeBackground'],
                        always: '#root.dm.voicegameapp.forest'
                    }
                }
            },
            forest: {
                initial: 'prompt',
                states: {
                    prompt: {
                        entry: say("This is a test"),
                        always: '#root.dm.init'
                    }
                }
                }
        },
    },
}
})


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
                entry: say(text),
                on: { ENDSPEECH: '#root.dm.voicegameapp.histforask' }, //backgroundChanger },
            },
            backgroundChanger: {
                entry: ['changeBackground'],
                always: '#root.dm.voicegameapp.forest'
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

// Sentences to ask if if no match
const notmatchedsentences = [
    "Sorry what did you say?",
    "Sorry I didn't understand what you said",
    "Could you repeat that?",
    "Could you say that again, please?",
    "What did you say?",
    ]

// Sentences will be randomized if utterance was not understood, to avoid repetitions
var randomNumber = Math.random
const randomnomatchedsentence = notmatchedsentences[Math.floor(Math.random() * Math.floor(notmatchedsentences.length))]


const menugrammar: { [index: string]: { beach?: string, forest?: string, help?: string, right?: string, left?:string, leave?: string, } } = {
    "It's a beach.": {beach: "beach" },
    "A beach": {beach: "beach"},
    "A forest": {forest: "forest" },
    "Forest.": {forest: "forest" },
    "It's a forest.": {forest: "forest" },
    "Help.": {help: "Help" },
    "Right.": {right: "right" },
    "Right?": {right: "right" },
    "Left": {left: "left" },
    "Left?": {left: "left"},
    "Leave.": {leave: "leave"},
}

const img_grammar: {[index: string]: {forest?: any}} = {
    "Forest.": {forest: bg}//new URL('https://nordicforestresearch.org/wp-content/uploads/2020/05/forest-4181023_1280.jpg')}
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
        noMatch: {
            initial: 'notmatched',
            states: {
                notmatched: {
                    entry: say(randomnomatchedsentence),
                    on: { ENDSPEECH: '#root.dm.voicegameapp.histforask'},
                }
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
        endofgame: {
            initial: 'end',
            states: {
                end: {
                    entry: say("Game ended. Please play again if you'd like to"),
                    on: {ENDSPEECH: '#root.dm.idle'}
                }
            },
        },
        voicegameapp: {
            initial: 'welcome',
            states: {
                hist: {
                    type: 'history',
                    history: 'shallow'
                },
                histforask: {
                    type: 'history',
                    history: 'deep',
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
                            target: '#root.dm.noMatch'
                        }
                    ],
                    TIMEOUT: '..', 
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
                            target: '#root.dm.noMatch'
                        }
                    ]
                },
                states: {
                    sayforest: {
                        entry: sayPlace,
                        on: { ENDSPEECH: 'tellforeststory' },
                    },
                    tellforeststory: {
                        ...promptAndAsk("To your right a river is flowing, and to the left there's a cave. Where would you like to go?"),
                    },
                },
            },
            //game ended
            right_cave: {
            ...prompt("You get hit in the head with a bat. You're now dead. Turns out, the one you talked to was the second in command. The older brother wants people to recognise he's in charge and you upset him. Too bad.")
        },
        left_river: {
            initial: 'cavestory',
            on: {
                RECOGNISED: [
                    {   target: '#root.dm.getHelp',
                        cond: (context) => "help" in (menugrammar[context.recResult[0].utterance] || {})
                    },
                    {
                        target: '#root.dm.endofgame',
                        cond: (context) => "leave" in (menugrammar[context.recResult[0].utterance] || {}),
                    },
                    {
                        target: 'offermoney',
                        cond: (context) => "money" in (menugrammar[context.recResult[0].utterance] || {}),
                    },
                    {
                        target: 'lookforacorns',
                        cond: (context) => "acorns" in (menugrammar[context.recResult[0].utterance] || {}),
                    },
                    {
                        target: '#root.dm.noMatch'
                    },

                ]
            },
            states: {
                cavestory: {
                    ...prompt("The troll tells you that for the small price of 10 acorns, they can let you inside the cave"),
                    on: {ENDSPEECH: 'cavealternatives'},
                },
                cavealternatives: {
                    ...promptAndAsk("You can leave, offer them money instead or look for acorns")
                }
            }
        },
        offermoney: {
            ...prompt("You offer money")
        },
        lookforacorns: {
            ...prompt("You look for acorns")
        }
    },
},
    },
})

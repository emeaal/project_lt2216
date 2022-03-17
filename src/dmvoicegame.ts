import { MachineConfig, send, Action, assign } from "xstate";

const sayPlace: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `You're right. It does seem to be a ${context.recResult[0].utterance}`
}))

function say(text: (context: SDSContext) => string): Action<SDSContext, SDSEvent> {
    return send((_context: SDSContext) => ({ type: "SPEAK", value: text(_context) }))
}

function prompt(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: { prompt: { entry: say(() => prompt) } }
    })
}

function promptAndAsk(prompt: string): MachineConfig<SDSContext, any, SDSEvent> {
    return ({
        initial: 'prompt',
        states: {
            prompt: {
                entry: say(() => prompt),
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
    "Sorry I don't understand",
    "Could you please repeat that?"
    ]


const menugrammar: { [index: string]: { beach?: string, forest?: string, help?: string, right?: string, left?:string, leave?: string, money?: string, cave?: string, } } = {
    "It's a beach.": {beach: "beach" },
    "A beach": {beach: "beach"},
    "Beach.": {beach: "beach"},
    "A forest": {forest: "forest" },
    "Forest.": {forest: "forest" },
    "Cave.": {cave: "cave"},
    "It's a forest.": {forest: "forest" },
    "Help.": {help: "Help" },
    "I don't know what to do": {help: "Help"},
    "Right.": {right: "right" },
    "Right?": {right: "right" },
    "Left": {left: "left" },
    "Left?": {left: "left"},
    "Leave.": {leave: "leave"},
    "Money.": {money: "money"}
}

const img_grammar: {[index: string]: {background?: any}} = {
    "Forest.": {background: 'https://nordicforestresearch.org/wp-content/uploads/2020/05/forest-4181023_1280.jpg'},
    "Beach.": {background: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/11/cd/51/9b/seven-mile-beach.jpg?w=1200&h=-1&s=1'},
    "Cave.": {background: 'https://i.pinimg.com/originals/d0/ce/b1/d0ceb103424a37b36ef58e0501cea6b3.jpg'},
    // "Acorns.": {background: ''}
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
                    entry: say(() => notmatchedsentences[Math.floor(Math.random() * (notmatchedsentences.length))]),
                    on: { ENDSPEECH: '#root.dm.voicegameapp.histforask'},
                }
            }
        },
        getHelp: {
            initial: 'helpmessage',
            states: {
                helpmessage: {
                    entry: say(() => "One thing that we actually have succeeded to implement at this moment is this help message"),
                    on: { ENDSPEECH: '#root.dm.voicegameapp'},
                }
            }
        },
        endofgame: {
            initial: 'end',
            states: {
                end: {
                    entry: say(() => "Game ended. Please play again if you'd like to"),
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
                entry: say(() => "Ok"),
                always: '#root.dm.idle'
            },
            welcome: {
                initial: 'prompt',
                on: {
                    RECOGNISED: [
                        {
                            target: 'forest',
                            cond: (context) => "forest" in (menugrammar[context.recResult[0].utterance] || {}),
                            actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})
                        },
                        {
                            target: 'beach',
                            cond: (context) => "beach" in (menugrammar[context.recResult[0].utterance] || {}),
                            actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})
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
                            target: 'cave',
                            cond: (context) => "cave" in (menugrammar[context.recResult[0].utterance] || {}),
                            actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})
                        },
                        {
                            target: 'river',
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
                        on: { ENDSPEECH: 'backgroundChanger' },
                    },
                    backgroundChanger: {
                        entry: ['changeBackground'],
                        always: 'tellforeststory'
                    },
                    tellforeststory: {
                        ...promptAndAsk("To your right a river is flowing, and to the left there's a cave. Where would you like to go?"),
                    },
                },
            },
            cave: {
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
                        ...prompt("You make your way to the cave. In front of it there are two trolls, but they don’t say anything."),
                        on: {ENDSPEECH: 'cavealternatives'},
                    },
                    cavealternatives: {
                        ...promptAndAsk("You decide to address one of them. Which one do you choose?")
                    }
                }
            },
        left_troll:
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
                    ...promptAndAsk("You can leave, offer them money or look for acorns")
                }
            }
        },
        offermoney: {
            initial: 'promptmoney',
            states: {
                promptmoney: {
                ...prompt("You say you don't have acorns, but you have 10 euros in your pocket . The trolls laugh. You should go look for some acorns then"),
                on: {ENDSPEECH: '#root.dm.voicegameapp.lookforacorns'}
            }, 
            }
            
        },
        lookforacorns: {
            ...prompt("You look for acorns")
        },
        beach: {
            initial: 'saybeach',
                on: {
                    RECOGNISED: [
                        {   target: '#root.dm.getHelp',
                            cond: (context) => "help" in (menugrammar[context.recResult[0].utterance] || {})
                        },
                        {
                            target: '#root.dm.noMatch'
                        }
                    ]
                },
                states: {
                    saybeach: {
                        entry: sayPlace,
                        on: { ENDSPEECH: 'backgroundChanger' },
                    },
                    backgroundChanger: {
                        entry: ['changeBackground'],
                        always: 'tellbeachstory'
                    },
                    tellbeachstory: {
                        ...promptAndAsk("Beach story"),
                    },
        },
    },
},
},
},
})

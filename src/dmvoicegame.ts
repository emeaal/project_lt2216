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
    "Sorry, what did you say?",
    "Sorry, I didn't understand what you said",
    "Could you repeat that?",
    "Could you say that again, please?",
    "What did you say?",
    "Sorry, I don't understand",
    "Could you please repeat that?",
    "I didn't understand you.",
    "What was that?"
    ]

const menu = {
    'forest': [
        "Forest."
    ],
    'beach': [
        "Beach."
    ],
    'cave': [
        "Cave.",
        "Go to the cave"
    ],
    'acorns': [
        "Acorns.",
        "Find some acorns.",
        "Find acorns.",
        "Try to find acorns"
    ],
    'shake': [
        "Shake.",
        "Shake it.",
        "Shake the tree.",
        "Try to shake it."
    ],
    'climb': [
        "Climb.",
        "Climb it.",
        "Climb the tree.",
        "Try to climb it."
    ],
    'left': [
        "Left.",
        "To the left.",
        "I want to go to the left.",
        "The left troll.",
        "To the left troll."
    ],
    'right': [
        "Right.",
        "To the right.",
        "I want to go to the right.",
        "The right troll.",
        "To the right troll."
    ],
    'leave': [
        "Leave.",
        "I want to leave."
    ],
    'money': [
        "Money.",
        "Offer money.",
        "Give them money"
    ],
    'help': [
        "Help.",
        "What should I do?.",
        "I don't know what to do.",
        "The right troll.",
        "To the right troll."
    ],

}



const img_grammar: {[index: string]: {background?: any}} = {
    "Forest.": {background: 'https://nordicforestresearch.org/wp-content/uploads/2020/05/forest-4181023_1280.jpg'},
    "Beach.": {background: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/11/cd/51/9b/seven-mile-beach.jpg?w=1200&h=-1&s=1'},
    "Cave.": {background: 'https://i.pinimg.com/originals/d0/ce/b1/d0ceb103424a37b36ef58e0501cea6b3.jpg'},
    "Acorns": {background: 'https://wallpaperaccess.com/full/4101978.jpg'}
}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    entry: assign({lifecounter: (context) => context.lifecounter = 3}),
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
            on: {
                RECOGNISED: [
                    {
                    target: '.twolivesleft',
                    cond: (context) => context.lifecounter === 2,
                    },
                    {
                        target: '.onelifeleft',
                        cond: (context) => context.lifecounter === 1,
                    },
                    {
                        target: '.end',
                        cond: (context) => context.lifecounter === 0
                    },
                    {
                        target: '#root.dm.noMatch'
                    }
                ]
            },
            states: {
                end: {
                    entry: say(() => "You ran out of lives. You died."),
                    on: {ENDSPEECH: '#root.dm.idle'}
                },
                twolivesleft: {
                    entry: say((context) => `You still have ${context.lifecounter} lives left. You can continue your game`),
                    on: {ENDSPEECH: '#root.dm.voicegameapp.hist'}
                },
                onelifeleft: {
                    entry: say((context) => `You still have ${context.lifecounter} life left. Use it with care`),
                    on: {ENDSPEECH: '#root.dm.voicegameapp.hist'}
                }
            }
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
                            cond: (context) => menu['forest'].includes(context.recResult[0].utterance),
                            actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})
                        },
                        {
                            target: 'beach',
                            cond: (context) => menu['beach'].includes(context.recResult[0].utterance),
                            actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})
                        },
                        {   target: '#root.dm.getHelp',
                            cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                        },
                        {
                            target: '#root.dm.noMatch'
                        }
                    ],
                    TIMEOUT: '..', 
                },
                ...promptAndAsk("Welcome!") // You wake up and find yourself in a strange place. But you can't quite tell where. I think you have something in your eyes. Could it be a forest…or more like a beach? What do you think? "), //You wake up and find yourself in a strange place. But you can't quite tell where. I think you have something in your eyes. Could it be a forest…or more like a beach? What do you think?
            },
            forest: {
                initial: 'sayforest',
                on: {
                    RECOGNISED: [
                        {   target: '#root.dm.getHelp',
                            cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                        },
                        {
                            target: 'cave',
                            cond: (context) => menu['cave'].includes(context.recResult[0].utterance),
                            actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})
                        },
                        {
                            target: '#root.dm.init',
                            cond: (context) => menu['left'].includes(context.recResult[0].utterance),
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
                            cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                        },
                        {
                            target: '#root.dm.endofgame',
                            cond: (context) => menu['leave'].includes(context.recResult[0].utterance),
                        },
                        {
                            target: 'left_troll',
                            cond: (context) => menu['left'].includes(context.recResult[0].utterance)                        },
                        {
                            target: '.right_troll',
                            cond: (context) => menu['right'].includes(context.recResult[0].utterance),
                        },
                        {
                            target: '#root.dm.noMatch'
                        },
    
                    ]
                },
                states: {
                    cavestory: {
                        ...prompt("You make your way to the cave."),
                        on: {ENDSPEECH: 'backgroundChanger'},
                    },
                    backgroundChanger: {
                        entry: ['changeBackground'],
                        always: 'cavealternatives'
                    },
                    cavealternatives: {
                        ...promptAndAsk("In front of it there are two trolls, but they don't say anything. You decide to address one of them. Which one do you choose?")
                    },
                    right_troll: {
                        initial:  'sayprompt',
                        states: {
                            sayprompt: {
                                entry:  [say(() => "You get hit in the head with a bat. You're now dead. Turns out, the one you talked to was the second in command. The older brother wants people to recognise he's in charge and you upset him."), 
                                assign({lifecounter: (context) => context.lifecounter - 1})],
                                on: { ENDSPEECH: '#root.dm.endofgame' },
                            },
                    },
                },
            },
        },
        left_troll: {
            initial: 'cavestory',
            on: {
                RECOGNISED: [
                    {   target: '#root.dm.getHelp',
                        cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: '#root.dm.endofgame',
                        cond: (context) => menu['leave'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: 'offer_money',
                        cond: (context) => menu['money'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: 'lookforacorns',
                        cond: (context) => menu['acorns'].includes(context.recResult[0].utterance),
                        actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})

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
                    ...promptAndAsk("You can leave, offer them money or look for acorns.")
                }
            }
        },
        offer_money: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {   target: '#root.dm.getHelp',
                        cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: '#root.dm.endofgame',
                        cond: (context) => menu['leave'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: 'lookforacorns',
                        cond: (context) => menu['acorns'].includes(context.recResult[0].utterance),
                        actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})

                    },
                    {
                        target: '#root.dm.noMatch'
                    },

                ]
            },
            states: {
                prompt: {
                    ...prompt("You say you don't have acorns, but you have 10 euros in your pocket . The trolls laugh."),
                    on: {ENDSPEECH: 'cavealternatives'},
                },
                cavealternatives: {
                    ...promptAndAsk("You can either leave or look for some acorns.")
                }
            }
        },
        lookforacorns: {
            initial: 'sayacorns',
            on: {
                RECOGNISED: [
                    {   target: '#root.dm.getHelp',
                        cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: '.shake_tree',
                        cond: (context) => menu['shake'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: '#root.dm.endofgame',
                        cond: (context) => menu['climb'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: '#root.dm.noMatch'
                    }
                ]
            },
            states: {
                sayacorns: {
                    ...prompt("You leave and find an oak."),
                        on: {ENDSPEECH: 'backgroundChanger'},
                },
                backgroundChanger: {
                    entry: ['changeBackground'],
                    always: 'tellforeststory'
                },
                tellforeststory: {
                    ...promptAndAsk("Do you shake it or try to climb it?"),
                },
                shake_tree: {
                    initial:  'sayprompt',
                    states: {
                        sayprompt: {
                            entry:  [say(() => "You shake the tree as hard as you can. A squirrel falls down and scratches at your eyes. The damage is so bad that you eventually die. Sorry."), 
                            assign({lifecounter: (context) => context.lifecounter - 1})],
                            on: { ENDSPEECH: '#root.dm.endofgame' },
                        },
                },
            },
            },
        },
    








        beach: {
            initial: 'saybeach',
                on: {
                    RECOGNISED: [
                        {   target: '#root.dm.getHelp',
                            cond: (context) => menu['help'].includes(context.recResult[0].utterance),
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

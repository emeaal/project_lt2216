import { MachineConfig, send, Action, assign } from "xstate";

const sayPlace: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `You're right. It does seem to be ${context.recResult[0].utterance}`
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
        "A forest."
    ],
    'beach': [
        "A beach."
    ],
    'boat': [
        "Boat.",
    ],
    'tree': [
        "Palm tree",
        "Tree.",
        "Tree",
        "3",
        "Three.",
        "Three"
    ],
    'cave': [
        "Cave.",
        "Go to the cave"
    ],
    'acorns': [
        "Acorns.",
        "Acorns",
        "Find some acorns",
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
        "Left",
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
        "To the right troll.",
        "Right?",
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
    'steal': [
        "Steal.",
        "Steal the acorns.",
        "Steal them.",
        "Try to steal.",
        "Try to steal them."
    ],

}



const img_grammar: {[index: string]: {background?: any}} = {
    "A forest.": {background: 'https://nordicforestresearch.org/wp-content/uploads/2020/05/forest-4181023_1280.jpg'},
    "Leave.": {background: 'https://thumbs.dreamstime.com/b/crossroads-forest-3448364.jpg'},
    "A beach.": {background: 'https://dynamic-media-cdn.tripadvisor.com/media/photo-o/11/cd/51/9b/seven-mile-beach.jpg?w=1200&h=-1&s=1'},
    "A cave.": {background: 'https://imgur.com/LN6RQOJ'},
    "Cave.": {background: 'https://imgur.com/LN6RQOJ'},
    "To the left.": {background: 'https://imgur.com/LN6RQOJ'},
    "To the right.": {background: 'https://i.imgur.com/LN6RQOJ.jpg'},
    "Left.": {background: 'https://i.pinimg.com/originals/d0/ce/b1/d0ceb103424a37b36ef58e0501cea6b3.jpg'},
    "Acorns": {background: 'https://wallpaperaccess.com/full/4101978.jpg'},
    "Find acorns.": {background: 'https://wallpaperaccess.com/full/4101978.jpg'},
    "Find some acorns" : {background: 'https://wallpaperaccess.com/full/4101978.jpg'},
    "Find some acorns.": {background: 'https://wallpaperaccess.com/full/4101978.jpg'},
    "Try to find acorns" : {background: 'https://wallpaperaccess.com/full/4101978.jpg'},
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
            initial: 'entry',
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
                        cond: (context) => context.lifecounter === 0,
                    },
                    {
                        target: '#root.dm.noMatch'
                    },
                ]
            },
            states: {
                entry: {
                    always: [
                        {
                            target: 'twolivesleft',
                            cond: (context) => context.lifecounter === 2,
                        },
                        {
                            target: 'onelifeleft',
                            cond: (context) => context.lifecounter === 1,
                        },
                        {
                            target: 'end',
                            cond: (context) => context.lifecounter === 0
                        },

                    ]
                },
                end: {
                    entry: say(() => "You ran out of lives. You died."),
                    on: {ENDSPEECH: '#root.dm.idle'},
                },
                twolivesleft: {
                    entry: say((context) => `You still have ${context.lifecounter} lives left. You can continue your game.`),
                    on: {ENDSPEECH: '#root.dm.voicegameapp.hist'}
                },
                onelifeleft: {
                    entry: say((context) => `You still have ${context.lifecounter} life left. You can continue your game`),
                    on: {ENDSPEECH: '#root.dm.voicegameapp.hist'},
                },
            },
        },
        endofgamebeach: {
            initial: 'entry',
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
                        cond: (context) => context.lifecounter === 0,
                    },
                    {
                        target: '#root.dm.noMatch'
                    },
                ]
            },
            states: {
                entry: {
                    always: [
                        {
                            target: 'twolivesleft',
                            cond: (context) => context.lifecounter === 2,
                            actions: assign({background: (context) => context.background = 'https://c.pxhere.com/images/6e/62/14ec0e80e4a8bfd7510e8745c88f-1628448.jpg!d'}),
                        },
                        {
                            target: 'onelifeleft',
                            cond: (context) => context.lifecounter === 1,
                            actions: assign({background: (context) => context.background = 'https://c.pxhere.com/images/6e/62/14ec0e80e4a8bfd7510e8745c88f-1628448.jpg!d'}),
                        },
                        {
                            target: 'end',
                            cond: (context) => context.lifecounter === 0
                        },

                    ]
                },
                end: {
                    entry: say(() => "You ran out of lives. You died."),
                    on: {ENDSPEECH: '#root.dm.idle'},
                },
                twolivesleft: {
                    entry: [say((context) => `You still have ${context.lifecounter} lives left. Try finding the right path`), 'changeBackground'],
                    on: {ENDSPEECH: '#root.dm.voicegameapp.welcome'}
                },
                onelifeleft: {
                    entry: [say((context) => `You still have ${context.lifecounter} life left. Try finding the right path`), 'changeBackground'],
                    on: {ENDSPEECH: '#root.dm.voicegameapp.welcome'},
                },
            },
        },
        voicegameapp: {
            initial: 'leave',
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
                entry: say(() => "Ok. Thanks for playing"),
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
                            target: 'stop', cond: (context) => context.recResult[0].utterance === ('Stop.')
                        },
                        {
                            target: '#root.dm.noMatch'
                        }
                    ],
                    TIMEOUT: '..', 
                },
                ...promptAndAsk("Welcome"), //You wake up and find yourself in a strange place. But you can't quite tell where. I think you have something in your eyes. Could it be a forest…or more like a beach? What do you think? "), //You wake up and find yourself in a strange place. But you can't quite tell where. I think you have something in your eyes. Could it be a forest…or more like a beach? What do you think?")
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
                            cond: (context) => menu['cave'].includes(context.recResult[0].utterance) || menu['left'].includes(context.recResult[0].utterance),
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
                        ...promptAndAsk("In front of it there are two trolls")
                    },
                    right_troll: {
                        initial:  'sayprompt',
                        states: {
                            sayprompt: {
                                entry:  [say(() => "You get hit in the head with a bat."), // You're now dead. Turns out, the one you talked to was the second in command. The older brother wants people to recognise he's in charge and you upset him."), 
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
                        target: 'leave',
                        cond: (context) => menu['leave'].includes(context.recResult[0].utterance),
                        actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})
                    },
                    {
                        target: 'offer_money_trolls',
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
        offer_money_trolls: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {   target: '#root.dm.getHelp',
                        cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: 'leave',
                        cond: (context) => menu['leave'].includes(context.recResult[0].utterance),
                        actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})

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
        leave: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {   target: '#root.dm.getHelp',
                        cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: '#root.dm.endofgame',
                        cond: (context) => menu['left'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: 'backtocave',
                        cond: (context) => menu['right'].includes(context.recResult[0].utterance),
                        actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})

                    },
                    {
                        target: '#root.dm.noMatch'
                    },

                ]
            },
            states: {
            prompt: {
                    ...prompt("You don't have time for that, you need to find your wallet, and these trolls definitely don’t have it.  You turn around and wander for a bit. "),
                    on: {ENDSPEECH: 'backgroundChanger'},
                },
            backgroundChanger: {
                entry: ['changeBackground'],
                always: 'wander'
            },
            wander: {
                ...promptAndAsk("You arrive at a crossroads. Do you go to the right or to the left?"),
                on: {ENDSPEECH: '#root.dm.init'},
            },
            }
        },
        backtocave: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {   target: '#root.dm.getHelp',
                        cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: '#root.dm.endofgame',
                        cond: (context) => menu['left'].includes(context.recResult[0].utterance),
                    },
                    // {
                    //     target: 'backtocave',
                    //     cond: (context) => menu['right'].includes(context.recResult[0].utterance),
                    // },
                    {
                        target: '#root.dm.voicegameapp.cave',
                        cond: (context) => menu['right'].includes(context.recResult[0].utterance),
                        actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background!})

                    },
                    {
                        target: '#root.dm.noMatch'
                    },

                ]
            },
            states: {
            prompt: {
                    ...prompt("You just walked in a circle and now you're back at the cave. I see your orientation skills aren't the best."),
                    on: {ENDSPEECH: 'backgroundChanger'},
                },
            backgroundChanger: {
                entry: ['changeBackground'],
                always: 'wander'
            },
            wander: {
                ...promptAndAsk("blablabla"),
                on: {ENDSPEECH: '#root.dm.init'},
            },
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
                        target: 'climb_tree',
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
        climb_tree: {
            initial: 'prompt',
            on: {
                RECOGNISED: [
                    {   target: '#root.dm.getHelp',
                        cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: '.steal',
                        cond: (context) => menu['steal'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: 'offer_money_squirrel',
                        cond: (context) => menu['money'].includes(context.recResult[0].utterance),
                    },
                    {
                        target: '#root.dm.noMatch'
                    },

                ]
            },
            states: {
                prompt: {
                    ...prompt("You climb the tree and find a squirrel's nest, with exactly 10 acorns."),
                    on: {ENDSPEECH: 'climbchoices'},
                },
                climbchoices: {
                    ...promptAndAsk("Do you try to steal them or try to give the squirrel the 10 euros?")
                },
                steal: {
                    initial:  'sayprompt',
                    states: {
                        sayprompt: {
                            entry:  [say(() => "Did you really think you would survive this? The squirrel immediately takes its revenge."), 
                            assign({lifecounter: (context) => context.lifecounter - 1})],
                            on: { ENDSPEECH: '#root.dm.endofgame' },
                        }
                },
            }
        }},
        offer_money_squirrel: {
            initial: 'prompt',
            states: {
                prompt: {
                    ...prompt("The squirrel accepts the transaction. You now have the acorns and go back to the trolls, but you wonder why a squirrel needs money."),
                    on: {ENDSPEECH: '#root.dm.init'},
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
                            target: '.boat',
                            cond: (context) => menu['boat'].includes(context.recResult[0].utterance)
                        },
                        {
                            target: '.palm_tree',
                            cond: (context) => menu['tree'].includes(context.recResult[0].utterance)
                        },
                        {
                            target: '#root.dm.noMatch'
                        }
                    ]
                },
                states: {
                    saybeach: {
                        entry: say(() => "It definitely looked like a forest to me, but if you say so, sure. It is a beach."),
                        on: { ENDSPEECH: 'backgroundChanger' },
                    },
                    backgroundChanger: {
                        entry: ['changeBackground'],
                        always: 'tellbeachstory'
                    },
                    tellbeachstory: {
                        ...promptAndAsk("You take a few steps forward to see more of your surroundings. To your left there's a stranded boat and to your right you see a few palm trees. Where do you go?"),
                    },
                    boat: {
                        initial:  'sayprompt',
                        states: {
                            sayprompt: {
                                entry:  [say(() => "Oh no! A shark was swimming right next to the boat. It attacks you and you don't survive. I told you it wasn't a beach...Too bad"),
                                assign({lifecounter: (context) => context.lifecounter - 1})], 
                                on: { ENDSPEECH: '#root.dm.endofgamebeach' },
                                },
                    },
                },
                palm_tree: {
                    initial:  'sayprompt',
                        states: {
                            sayprompt: {
                                entry:  [say(() => "Oh no! A coconut falls from the palm tree and hits you in the head. I told you it wasn't a beach. You should've listened to me. Too bad you didn't"), 
                                assign({lifecounter: (context) => context.lifecounter - 1})],
                                on: { ENDSPEECH: '#root.dm.endofgamebeach' },
                                },
                },
        },
    },
},
},
},
},
})

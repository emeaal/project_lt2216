import { MachineConfig, send, Action, assign } from "xstate";
import {img_grammar} from './images'

const blackbackground = 'https://esquilo.io/wallpaper/wallpaper/20210704/black-wallpaper-plain-plain-black-desktop-wallpapers-on-wallpaperdog-preview.webp'

const sayPlace: Action<SDSContext, SDSEvent> = send((context: SDSContext) => ({
    type: "SPEAK", value: `You're right. It does seem to be a ${context.place}`
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
                entry: [say(() => prompt), assign({promptcounter: (context) => context.promptcounter = 0})],
                on: { ENDSPEECH: 'ask' }
            },
            ask: { entry: send('LISTEN') },
            hist: {
                    type: 'history',
                    history: 'deep'
                },
        }
    })
}

// Sentences to ask if if no match
const notmatchedsentences = [
    "What did you say?",
    "Can you speak up?",
    "Maybe work on your enunciation.",
    "Am I deaf or did you mumble?",
    "What was that?",
    "Are you shy, or what?",
    "Don't be shy.",
    "Are you eating and speaking?",
    "Take a breath and try again.",
    "Are you slow?",
    "Could you repeat that?",
]

const helpmessages = [
    "Didn't you pay attention to the rules?",
    "I don't think it is so hard to figure out.",
    "Think harder.",
    "Let me say that again.",
    "You have a short memory it seems.",
    "Are you slow?"
]

const lostlives = [
    "Oops, you lost a life",
    "Oh no! You lost a life",
    "Oops, this was definitely not the right path to search for your wallet. You lost a life",
    "Well, this was a wrong turn. You lost a life.",
    "You should be searching for your wallet, not finding ways to die",
    "Unfortunately this was not what you expected, you lost a life",
    "Good job! You lost a life.",
    "Nice! One step closer to death. You lost a life."
]

const stopwords: { [index: string]: { stop?: string } } = {
    "Stop.": { stop: "Stop" },
    "Shut up.": {stop: "Stop"},
    "I don't want to play anymore.": {stop: "Stop"},
    "End game.": {stop: "Stop"},
    "Quit game.": {stop: "Stop"},
    "Quit playing.": {stop: "Stop"},
    "End the game.": {stop: "Stop" }
}

// I got sick of scrolling for ages so I made them horizontal instead of vertical :--)
const menu : { [index: string]: Array<string> } = {
    'forest': ["A forest.", "Forest.", "It's a forest."
    ],
    'beach': ["A beach.", "Beach", "It's a beach.", "I think it's a beach", "Beach."
    ],
    'boat': ["Boat.",
    ],
    'tree': ["Palm tree", "Tree.", "Tree", "3.", "Three.","Three", "Trees.",
    ],
    'cave': ["Cave.", "Go to the cave", "To The Cave"
    ],
    'acorns': [ "Acorns.","Acorns", "Find some acorns", "Find some acorns.", "Find acorns.","Try to find acorns","Try to look for acorns.", "Look for acorns."
    ],
    'shake': [ "Shake.","Shake it.","Shake the tree.", "Try to shake it."
    ],
    'climb': ["Climb.", "Climb it.", "Climb the tree.","Try to climb it."
    ],
    'left': [ "Left.","Left", "To the left.", "To the left one.","The left one.","I want to go to the left.", "The left troll.",  "To the left troll."
    ],
    'right': [ "Right.","To the right.",  "The right one.", "To the right one.", "I want to go to the right.", "The right troll.","To the right troll.", "Right?",
    ],
    'leave': [ "Leave.","I want to leave."
    ],
    'money': [ "Money.", "Offer money.","Offer it money", "Try to offer it money", "Offer money to it", "Give them money", "Give it the bill.", "Give it the money.", "Try to give it the bill.", "Try to give it the money."
    ],
    'help': [ "Help.","What should I do?.","I don't know what to do.","The right troll.", "To the right troll."
    ],
    'steal': ["Steal.", "Steal the acorns.", "Steal them.","Try to steal.","Try to steal them."
    ],
    'talk': [ "Try to talk to the trolls.", "Talk to the trolls.", "Try to talk to the trolls again.", "Talk to the trolls again.", "Talk.", "Talk"
    ],
    'path': [ "Try another path.", "Find another path.", "Try to find another path.", "Take another path.", "Go on another path.",  "Try to go on another path.", "Another path.", "Another path"
    ],
    'else': [ "Go somewhere else.", "I want to go somewhere else."
    ],
    'wait': [ "Wait.", "Wait here.", "Let's wait.", "Let's wait a bit.", "Wait a bit.", "Wait?"
    ],
    'shout': [ "Shout.", "Shout profanities.", "Shout at it.", "Shout profanities at it."
    ],
    'cross': [ "Cross.", "Cross the river.", "Try to cross.", "Try to cross the river."
    ],
    'yes': ["Yes."
    ],
    'no': ["No."
    ],
    'lure': ["Try to lure it.", "Lure it.", "Lure.", "Lure"
    ],
    'take': ["Take the wallet.", "Try to take the wallet.", "Take it.", "Try to take it."
    ],
    'change': ["I change my mind.", "I changed my mind.", "Changed my mind", "Change your mind."
    ],
    'inside': ["Go inside.", "I go inside.", "Inside.", "Go inside The Cave.", "I go inside The Cave."
    ],
    'buy': ["Buy an ice cream.", "Buy.", "I buy an ice cream."]

    

}

export const dmMachine: MachineConfig<SDSContext, any, SDSEvent> = ({
    initial: 'idle',
    entry: assign({ lifecounter: (context) => context.lifecounter = 3 }),
    states: {
        idle: {
            on: {
                CLICK: 'init'
            }
        },
        init: {
            entry: [assign({ background: (context) => context.background = 'https://c.pxhere.com/images/6e/62/14ec0e80e4a8bfd7510e8745c88f-1628448.jpg!d'})],
            on: {
                TTS_READY: 'voicegameapp',
                CLICK: 'voicegameapp',
            }
        },
        noMatch: {
            initial: 'notmatched',
            states: {
                notmatched: {
                    entry: say(() => notmatchedsentences[Math.floor(Math.random() * (notmatchedsentences.length))]),
                    on: { ENDSPEECH: 'backgroundChanger' },
                },
                backgroundChanger: {
                    entry: ['changeBackground'],
                    always: '#root.dm.voicegameapp.histforask'
                },
            }
        },
        getHelp: {
            initial: 'helpmessage',
            states: {
                helpmessage: {
                    entry: say(() => helpmessages[Math.floor(Math.random() * (helpmessages.length))]),
                    on: { ENDSPEECH: '#root.dm.voicegameapp' },
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
                ],
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
                            cond: (context) => context.lifecounter === 0,
                            actions: assign({background: (context) => context.background = blackbackground}),
                        },
                    ]
                },
                end: {
                    entry: [say(() => "You ran out of lives. You died."), 'changeBackground'], //i tried fixing the background when one dies
                    on: { ENDSPEECH: '#root.dm.idle' },
                },
                twolivesleft: {
                    entry: say(() => lostlives[Math.floor(Math.random() * (lostlives.length))]),
                    on: { ENDSPEECH: 'telltwolives' }
                },
                telltwolives: {
                    entry: say((context) => `You still have ${context.lifecounter} lives left. You can continue your game from the nearest checkpoint.`),
                    on: { ENDSPEECH: '#root.dm.voicegameapp.hist' }
                },
                onelifeleft: {
                    entry: say(() => lostlives[Math.floor(Math.random() * (lostlives.length))]),
                    on: { ENDSPEECH: 'tellonelife' }
                },
                tellonelife: {
                    entry: say((context) => `You still have ${context.lifecounter} life left. You can continue your game from the nearest checkpoint.`),
                    on: { ENDSPEECH: '#root.dm.voicegameapp.hist' },
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
                            actions: assign({ background: (context) => context.background = 'https://c.pxhere.com/images/6e/62/14ec0e80e4a8bfd7510e8745c88f-1628448.jpg!d' }),
                        },
                        {
                            target: 'onelifeleft',
                            cond: (context) => context.lifecounter === 1,
                            actions: assign({ background: (context) => context.background = 'https://c.pxhere.com/images/6e/62/14ec0e80e4a8bfd7510e8745c88f-1628448.jpg!d' }),
                        },
                        {
                            target: 'end',
                            cond: (context) => context.lifecounter === 0,
                            actions: assign({background: (context) => context.background = blackbackground})
                        },
                    ]
                },
                end: {
                    entry: [say(() => "You ran out of lives. You died."), 'changeBackground'],
                    on: { ENDSPEECH: '#root.dm.idle' },
                },
                twolivesleft: {
                    entry: [say((context) => `You still have ${context.lifecounter} lives left. Try finding the right path`), 'changeBackground'],
                    on: { ENDSPEECH: '#root.dm.voicegameapp.welcome.hist' }
                },
                onelifeleft: {
                    entry: [say((context) => `You still have ${context.lifecounter} life left. Try finding the right path`), 'changeBackground'],
                    on: { ENDSPEECH: '#root.dm.voicegameapp.welcome.hist' },
                },
            },
        },
        voicegameapp: {
            initial: 'hello',
            entry: 'changeBackground',
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
                hello: {
                    entry: say(() => "Hello! And welcome to our game, The Lost Wallet. Before we begin, I am going to explain the rules to you. After a night of partying, you realise you have lost your wallet under curious circumstances. You have to navigate an unknown territory in order to find it, and be very careful to the choices you are presented with. You have three lives. When you die, you respawn to the nearest checkpoint, but if you lose all of them, it's game over. You have nothing with you except for two 5 euros bills. Good luck and have fun!"), 
                    on: { ENDSPEECH: 'welcome' },               
                },
                welcome: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [
                            { //There's probably a way to make these into lowercase so we don't have to type all alternatives with both Capital letter and without
                                target: 'forest',
                                cond: (context) => context.recResult[0].utterance.includes("forest") || context.recResult[0].utterance.includes("Forest"), // seems like we need this as well...                            
                                actions: assign({ background: (context) => img_grammar["Forest."].background! })
                            },
                            {
                                target: 'beach',
                                cond: (context) => context.recResult[0].utterance.includes("beach") || context.recResult[0].utterance.includes("Beach"),
                                actions: assign({ background: (context) => img_grammar["Beach."].background! })
                            },
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: '..',
                    },
                    ...promptAndAsk("You wake up and find yourself in a strange place. But you can't quite tell where. I think you have something in your eyes. Could it be a forest…or more like a beach? What do you think? "),
                },
                forest: {
                    initial: 'sayforest',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'cave',
                                cond: (context) => context.recResult[0].utterance.includes("Cave") || context.recResult[0].utterance.includes("North") || context.recResult[0].utterance.includes("north"),
                                actions: assign({ background: (context) => img_grammar["Cave."].background! })
                            },
                            {
                                target: 'river1',
                                cond: (context) => context.recResult[0].utterance.includes("river") || context.recResult[0].utterance.includes("South"),
                                actions: assign({ background: (context) => img_grammar["River."].background! })
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        sayforest: {
                            entry: [assign({place: (context) => context.place = "forest"}), sayPlace],
                            on: { ENDSPEECH: 'backgroundChanger' },
                        },
                        backgroundChanger: {
                            entry: ['changeBackground'],
                            always: 'tellforeststory'
                        },
                        tellforeststory: {
                            ...promptAndAsk("Down south you hear a river flowing, and up north there's a cave. Where would you like to go?"),
                        },
                    },
                },
                cave: {
                    initial: 'cavestory',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '#root.dm.endofgame',
                                cond: (context) => menu['leave'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'left_troll',
                                cond: (context) => menu['left'].includes(context.recResult[0].utterance)
                            },
                            {
                                target: '.right_troll',
                                cond: (context) => menu['right'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch',
                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        cavestory: {
                            ...prompt("You make your way to the cave."),
                            on: { ENDSPEECH: 'backgroundChanger' },
                        },
                        backgroundChanger: {
                            entry: ['changeBackground'],
                            always: 'cavealternatives'
                        },
                        cavealternatives: {
                            ...promptAndAsk("In front of it there are two trolls, but they don't say anything. Which one do you adress?")
                        },
                        right_troll: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: [say(() => "You get hit in the head with a bat. You're now dead. Turns out, the one you talked to was the second in command. The older brother wants people to recognise he's in charge and you upset him."), 
                                    assign({ lifecounter: (context) => context.lifecounter - 1 })],
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
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'leave',
                                cond: (context) => context.recResult[0].utterance.includes("leave"),
                                actions: assign({ background: (context) => img_grammar["Leave."].background! })
                            },
                            {
                                target: 'offer_money_trolls',
                                cond: (context) => context.recResult[0].utterance.includes("money") || context.recResult[0].utterance.includes("offer") || context.recResult[0].utterance.includes("Money") || context.recResult[0].utterance.includes("Offer"),
                            },
                            {
                                target: 'lookforacorns',
                                cond: (context) => context.recResult[0].utterance.includes("acorns") || context.recResult[0].utterance.includes("look"),
                                actions: assign({ background: (context) => img_grammar["Acorns."].background! })
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        cavestory: {
                            ...prompt("The troll tells you that for the small price of 10 acorns, they can let you inside the cave"),
                            on: { ENDSPEECH: 'cavealternatives' },
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
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'leave',
                                cond: (context) => context.recResult[0].utterance.includes("leave"),
                                actions: assign({ background: (context) => img_grammar["Leave."].background! })
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: 'lookforacorns',
                                cond: (context) => context.recResult[0].utterance.includes("acorn") || context.recResult[0].utterance.includes("look"),
                                actions: assign({ background: (context) => img_grammar["Acorns."].background! })
                            },
                            {
                                target: '#root.dm.noMatch'
                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            ...prompt("You say you don't have acorns, but you have two 5 euros bills in your pocket. The trolls laugh."),
                            on: { ENDSPEECH: 'cavealternatives' },
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
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'river1',
                                cond: (context) => menu['left'].includes(context.recResult[0].utterance),
                                actions: assign({ background: (context) => img_grammar["River."].background! })

                            },
                            {
                                target: 'backtocave',
                                cond: (context) => menu['right'].includes(context.recResult[0].utterance),
                                actions: assign({ background: (context) => img_grammar["Cave."].background! })
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            ...prompt("You don't have time for that, you need to find your wallet, and these trolls definitely don't have it.  You turn around and wander for a bit. You arrive at a crossroads."),
                            on: { ENDSPEECH: 'backgroundChanger' },
                        },
                        backgroundChanger: {
                            entry: ['changeBackground'],
                            always: 'wander'
                        },
                        wander: {
                            ...promptAndAsk("Do you go to the right or to the left?"),
                            on: { ENDSPEECH: '#root.dm.init' },
                        },
                    }
                },
                backtocave: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'talktotrolls',
                                cond: (context) => menu['talk'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'anotherpath',
                                cond: (context) => menu['path'].includes(context.recResult[0].utterance),
                                actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background! })
 
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            ...prompt("You just walked in a circle and now you're back at the cave. I see your orientation skills aren't the best."),
                            on: { ENDSPEECH: 'backgroundChanger' },
                        },
                        backgroundChanger: {
                            entry: ['changeBackground'],
                            always: 'wander'
                        },
                        wander: {
                            ...promptAndAsk("Do you try to talk to the trolls again or find another path?"),
                            on: { ENDSPEECH: '#root.dm.init' },
                        },
                    }
                },
                talktotrolls: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '.trollskill',
                                cond: (context) => menu['talk'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: 'anotherpath',
                                cond: (context) => menu['path'].includes(context.recResult[0].utterance),
                                actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background! })

                            },
                            {
                                target: '#root.dm.noMatch'
                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            ...prompt("The trolls don't want to waste their time with you again. You should find another path before they get too mad. Or you could try again. But I wouldn't personally recommend that."),
                            on: { ENDSPEECH: 'choices' },
                        },
                        choices: {
                            ...promptAndAsk("So what will it be?"),
                            on: { ENDSPEECH: 'trollskill' },
                        },
                        trollskill: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: [say(() => "I don't know why you won't listen to me. The trolls have had enough of you. They club you to death."),
                                    assign({ lifecounter: (context) => context.lifecounter - 1 })],
                                    on: { ENDSPEECH: '#root.dm.endofgame' },
                                },
                            },

                        },
                    }
                },
                anotherpath: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.voicegameapp.river2',
                                cond: (context) => menu['yes'].includes(context.recResult[0].utterance),
                                actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background! })

                            },
                            {
                                target: '.what',
                                cond: (context) => menu['no'].includes(context.recResult[0].utterance),
                                actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background! })

                            },
                            {
                                target: '#root.dm.noMatch'
                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            ...prompt("You're back to that crossroads again."),
                            on: { ENDSPEECH: 'backgroundChanger' },
                        },
                        backgroundChanger: {
                            entry: ['changeBackground'],
                            always: 'omg'
                        },
                        omg: {
                            ...promptAndAsk("Omg, Look! A squirrel has your wallet. Do you want to chase it?"),
                        },
                        what: {
                            ...prompt("What do you mean, no? We're chasing it. Come on."),
                            on: { ENDSPEECH: '#root.dm.voicegameapp.river2' },    
                        }
                    }                
                },
                river2: {
                    initial: 'prompt',
                    states: {
                        prompt: {
                            ...prompt("It led you to the river."),
                            on: { ENDSPEECH: 'backgroundChanger' },
                        },
                        backgroundChanger: {
                            entry: ['changeBackground'],
                            always: '#root.dm.voicegameapp.squirrelriver'
                        }
                    } 
                },
                river1: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '.somewhere_else',
                                cond: (context) => menu['else'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '#root.dm.voicegameapp.river1.wait',
                                cond: (context) => menu['wait'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '#root.dm.voicegameapp.river1.look',                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            ...prompt("You get to a river."),
                            on: { ENDSPEECH: 'backgroundChanger' },
                        },
                        backgroundChanger: {
                            entry: ['changeBackground'],
                            always: 'ask'
                        },
                        ask: {
                            ...promptAndAsk("Not much to see here actually. Do you want to wait here for a bit, or go somewhere else?"),
                        },
                        somewhere_else: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: [say(() => "Ugh I don't know about that. I mean, you just got here but I also work on the alternative paths and it's been a long way to get here from the cave. I'm a bit tired.")],
                                    on: { ENDSPEECH: '#root.dm.voicegameapp.river1.wait' },
                                },
                            },
                        },
                        wait: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    
                                    ...prompt("Let's wait then. So have you seen a good movie lately? "),
                                    on: { ENDSPEECH: 'ask' },
                                },
                                ask: {
                                    entry: send('LISTEN'),
                                }
                            },
                        },
                        look: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: [say(() => "Nevermind! Look! A squirrel has your wallet! Do something!")],
                                    on: { ENDSPEECH: '#root.dm.voicegameapp.squirrelriver' },
                                },
                            },
                        },
                    },
                },
                squirrelriver: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '#root.dm.voicegameapp.squirrelriver.cross',
                                cond: (context) => context.recResult[0].utterance.includes("cross") || context.recResult[0].utterance.includes("river"),
                            },
                            {
                                target: '#root.dm.voicegameapp.squirrelriver.shout',
                                cond: (context) => menu['shout'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '#root.dm.voicegameapp.lure',
                                cond: (context) => menu['lure'].includes(context.recResult[0].utterance) || context.recResult[0].utterance.includes("river"),
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            ...prompt("The squirrel crosses the river before you can reach it."),
                            on: { ENDSPEECH: 'ask' },
                        },
                        ask: {
                            ...promptAndAsk("Do you try to: cross the river, shout profanities at the squirrel, or try to lure it with that 5 euros bill you had left?"),
                        },
                        cross: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: [say(() => "You try to cross the river but you lose your balance and you fall in it. You drown."),
                                    assign({ lifecounter: (context) => context.lifecounter - 1 })],
                                    on: { ENDSPEECH: '#root.dm.endofgamebeach' },
                                },
                            },
                        },
                        shout: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: say(() => "Out of frustration you shout some pretty heavy stuff at the squirrel. I guess somehow it understood you, because it throws your wallet in the river. Nice job genius. You lose the game, your wallet is gone forever."),
                                    on: { ENDSPEECH: '#root.dm.init' },
                                },
                            },
                        },
                    },
                },
                lure: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '#root.dm.voicegameapp.ending1',
                                cond: (context) => menu['money'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '#root.dm.voicegameapp.ending2',
                                cond: (context) => menu['take'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            ...prompt("You whip out your shiny bill and wave it around. The squirrel is immediately attracted to it and crosses the river back to you."),
                            on: { ENDSPEECH: 'ask' },
                        },
                        ask: {
                            ...promptAndAsk("Do you try to give it the bill in exchange for your wallet, or try to take it forcibly?"),
                        },
                    },
                },
                ending1: {
                    initial: 'prompt',
                    states: {
                        prompt: {
                            ...prompt("The squirrel actually takes the bill and gives you the wallet. Dumb squirrel, you think to yourself, but then again, how could it know the difference between a lot of money and a few? Maybe it just likes the color green more. Congratulations! You have won the game! And it seems like the squirrel has offered to help lead you out of the forest and find your way home. I think you're in good hands. Goodbye and congratulations!"),
                            on: { ENDSPEECH: '#root.dm.init' },
                        },
                    },
                },
                ending2: {
                    initial: 'prompt',
                    states: {
                        prompt: {
                            ...prompt("I didn't think you could do it, but you really are trying to fight this squirrel. It's suspiciously strong too. After a good tussle, you manage to rip your wallet out of its grasp. The squirrel scratches at your face one last time and scurries away. Congratulations! You're now left alone, with your wallet but no idea of how to get back home. I think you're on your own with this one, buddy. Goodbye."),
                            on: { ENDSPEECH: '#root.dm.init' },
                        },
                    },
                },
                lookforacorns: {
                    initial: 'sayacorns',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
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
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        sayacorns: {
                            ...prompt("You leave and find an oak."),
                            on: { ENDSPEECH: 'backgroundChanger' },
                        },
                        backgroundChanger: {
                            entry: ['changeBackground'],
                            always: 'tellforeststory'
                        },
                        tellforeststory: {
                            ...promptAndAsk("Do you shake it or try to climb it?"),
                        },
                        shake_tree: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: [say(() => "You shake the tree as hard as you can. A squirrel falls down and scratches at your eyes. The damage is so bad that you eventually die. Sorry."),
                                    assign({ lifecounter: (context) => context.lifecounter - 1 })],
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
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '.steal',
                                cond: (context) => menu['steal'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '.offermoneysquirrel',
                                cond: (context) => menu['money'].includes(context.recResult[0].utterance),
                                actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background! })
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            ...prompt("You climb the tree and find a squirrel's nest, with exactly 10 acorns."),
                            on: { ENDSPEECH: 'climbchoices' },
                        },
                        climbchoices: {
                            ...promptAndAsk("Do you try to steal them or try to give the squirrel 5 euros?")
                        },
                        steal: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: [say(() => "Did you really think you would survive this? The squirrel immediately takes its revenge."),
                                    assign({ lifecounter: (context) => context.lifecounter - 1 })],
                                    on: { ENDSPEECH: '#root.dm.endofgame' },
                                }
                            },
                        },
                        offermoneysquirrel: {
                            initial: 'prompt',
                            states: {
                                prompt: {
                                    ...prompt("The squirrel accepts the transaction. You now have the acorns and go back to the trolls, but you wonder why a squirrel needs money."),
                                    on: { ENDSPEECH: 'backgroundChanger' },

                                },
                                backgroundChanger: {
                                    entry: ['changeBackground'],
                                    always: '#root.dm.voicegameapp.cave2'
                                },
                            },
                        }
                    }
                },
                cave2: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: 'insidecave',
                                cond: (context) => menu['inside'].includes(context.recResult[0].utterance),
                                actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background! })
                            },
                            {
                                target: '#root.dm.voicegameapp.leave',
                                cond: (context) => menu['change'].includes(context.recResult[0].utterance),
                                actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background! })
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            ...prompt("You give the trolls the 10 acorns."),
                            on: { ENDSPEECH: 'choices' },
                        },
                        choices: {
                            ...promptAndAsk("Do you go inside the cave or do you change your mind?")
                        },   
                    }
                },

                insidecave: {
                    initial: 'prompt',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '.buy',
                                cond: (context) => menu['buy'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '#root.dm.voicegameapp.leave',
                                cond: (context) => menu['leave'].includes(context.recResult[0].utterance),
                                actions: assign({ background: (context) => img_grammar[context.recResult[0].utterance].background! })
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            },
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        prompt: {
                            entry: say(() => "You are now inside the cave."),
                            on: { ENDSPEECH: 'backgroundChanger' },
                        },
                        backgroundChanger: {
                            entry: ['changeBackground'],
                            always: [
                                {target: 'inside'},
                            ],
                        },
                        inside: {
                            ...promptAndAsk("Out of all the things you expected to see here, you find the unexpected. There's an ice cream stand inside the cave. Do you buy an ice cream or leave?"),
                        },
                        buy: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: [say(() => "You buy a strawberry ice cream with the 5 euros you had left, but you unexpectedly lose a life. Weird. "),
                                    assign({ lifecounter: (context) => context.lifecounter - 1 })],
                                    on: { ENDSPEECH: '#root.dm.endofgame' },
                                },
                            },
                        },
                    }
                },

                beach: {
                    initial: 'saybeach',
                    on: {
                        RECOGNISED: [
                            {
                                target: '#root.dm.getHelp',
                                cond: (context) => menu['help'].includes(context.recResult[0].utterance),
                            },
                            {
                                target: '.boat',
                                cond: (context) => context.recResult[0].utterance.includes("boat") || context.recResult[0].utterance.includes("left"),
                            },
                            {
                                target: '.palm_tree',
                                cond: (context) => context.recResult[0].utterance.includes("tree") || context.recResult[0].utterance.includes("right"),
                            },
                            {
                                target: 'stop', cond: (context) => "stop" in (stopwords[context.recResult[0].utterance] || {}) 
                            },
                            {
                                target: '#root.dm.noMatch'
                            }
                        ],
                        TIMEOUT: '..',
                    },
                    states: {
                        saybeach: {
                            entry: say(() => "It definitely looked like a forest to me, but if you say so, sure. It is a beach."),
                            on: { ENDSPEECH: 'backgroundChanger' },
                        },
                        backgroundChanger: {
                            entry: ['changeBackground'],
                            always: [
                                {target: 'tellbeachstory1', cond: (context) => context.lifecounter === 3},
                                {target: 'tellbeachstory2', cond: (context) => context.lifecounter < 3},
                            ],
                        },
                        tellbeachstory1: {
                            ...promptAndAsk("You take a few steps forward to see more of your surroundings. To your left there's a stranded boat and to your right you see a few palm trees. Where do you go?"),
                        },
                        tellbeachstory2: {
                            ...promptAndAsk("You've been here before. You take a look at your surroundings. Do you go to the boat to the left or to the palm trees on the right?")
                        },
                        boat: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: [say(() => "Oh no! A shark was swimming right next to the boat. It attacks you and you don't survive. I told you it wasn't a beach...Too bad"),
                                    assign({ lifecounter: (context) => context.lifecounter - 1 })],
                                    on: { ENDSPEECH: '#root.dm.endofgamebeach' },
                                },
                            },
                        },
                        palm_tree: {
                            initial: 'sayprompt',
                            states: {
                                sayprompt: {
                                    entry: [say(() => "Oh no! A coconut falls from one of the palm trees and hits you in the head. I told you it wasn't a beach. You should've listened to me. Too bad you didn't"),
                                    assign({ lifecounter: (context) => context.lifecounter - 1 })],
                                    on: { ENDSPEECH: '#root.dm.endofgamebeach' },
                                },
                            },
                        },
                    },
                }
            }
        }
    }
}
)

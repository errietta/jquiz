# Kanji Quiz Game

This is a simple Kanji Quiz Game built with HTML, CSS, and JavaScript. The game allows users to test their knowledge of Kanji characters by answering questions within a time limit.

## Features

- Multiple quiz types 
- Timer for each question
- Score tracking
- Lives system
- Game over prompt with continue option

## Getting Started

### Prerequisites

- A web browser

### Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/yourusername/jquiz.git
    ```
2. Navigate to the project directory:
    ```sh
    cd jquiz
    ```

### Usage

1. Run `npm start`
2. Click on one of the start buttons to begin the quiz.
3. Answer the questions by typing your answer and pressing Enter.
4. The game will track your score and lives. If you run out of lives, you will be prompted to continue or end the game.

## Project Structure

```
jquiz/
├── vocab/             # Vocabulary JSON files
├── game.html          # Main HTML file
├── game.js            # JavaScript file
├── style.css          # CSS file
└── README.md          # This file
```

## Create android release (NEW)
- Change stuff
- Replace 'versionCode' and 'versionName'
- `make sync`

Set the following:
```
JQUIZ_RELEASE_STORE_FILE=<keystore path>
export JQUIZ_RELEASE_KEY_ALIAS=<the alias>
export JQUIZ_RELEASE_STORE_PASSWORD=<password>
export JQUIZ_RELEASE_KEY_PASSWORD=<password>
```
- `make build`
Open Android studio: `npx cap open android`

Build -> generate signed bundle or apk -> bundle
Choose Android Release Build (.aab)
Enter the keystore password
Enter the key password
The AAB file will be saved in the folder android/app/build/outputs/bundle/release


## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

See LICENSE

## Attribution

JLPT vocabulary list by http://www.tanos.co.uk/jlpt/skills/vocab/. JLPT Vocab list is shared under a CC-BY license.


# Development history

It all started in 1994, when I was born...
Just kidding.
What I wanted to say was, that I started this app as a bubblewrapped PWA.
I thought it would be good enough, despite the "app running in chrome" warning.
However, the UK mobile network providers ruined my plans.
You see, if you are on 4G or 5G, by default your network provider will block 'adult' websites. For some unknown reason (I guess Kanji is too sexy?) at least one of the UK's major providers decided to block the website behind the application.
Given that I can't foresee such issues, and it's a bit of a big ask to tell every user to call their network and tell them to stop being silly, it accelerated the move towards a more 'native' approach using Capacitor.js. It's still not native code, but it's now technically a native app.
This is a change that would probably have to happen eventually anyway. Bubblewrapped PWAs are just too janky to go to production with.
So I'd like to thank the UK telcos for accelerating this process.

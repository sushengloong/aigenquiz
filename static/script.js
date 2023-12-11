async function submitGenerate(e) {
    e.preventDefault();

    const inputUrl = e.target.querySelector('input[name=inputUrl]').value.trim();
    const data = {input_url: inputUrl};
    if (!!inputUrl) {
        document.querySelector('#output').innerHTML = 'Generating... Please wait...';
        const response = await fetch('/generate', {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        });
        const responseJson = await response.json();
        let output = '';
        responseJson.quizes.forEach((quiz) => {
            output += `[${quiz.difficulty}] ${quiz.question}<br>`;
            output += '<ol>';
            quiz.choices.forEach((choice) => {
                output += `<li>${choice.choice}</li>`;
            });
            output += '</ol><br>';
            output += `Hint: ${quiz.hint}<br><br>`;

            output += '------------------------<br><br>';

            output += `Answer: ${quiz.answer}<br>${quiz.explanation}<br>`
            output += '<ol>'
            quiz.choices.forEach((choice) => {
                const symbol = choice.is_correct ? '&check;' : '&cross;';
                output += `<li>${symbol} ${choice.choice}<ul><li>${choice.explanation}</li></ul></li>`;
            });
            output += '</ol>'
            output += '<hr><br><br>';
        });
        document.querySelector('#output').innerHTML = output;
    } else {
        // TODO
        alert('Please enter a valid URL');
    }

    return false;
};

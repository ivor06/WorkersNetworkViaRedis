# WorkersNetworkViaRedis
Network of process message workers via Redis

# Quickstart:

1) Install node.js and npm: https://nodejs.org/en/download/
2) Install and start Redis server: https://redis.io/topics/quickstart
3) Clone this repository: "git clone git@github.com/ivor06/WorkersNetworkViaRedis"
4) Install dependencies: "npm install"
5) Compile typescript files: ./node_modules/.bin/tsc
6) Run worker spawn: "npm start" or "node dist/app"
7) Run worker for errors handling: "node dist/worker getErrors"

# The task was:
Задача написать приложение, работающее с redis, умеющее как генерировать сообщения, так и обрабатывать. Параллельно может быть запущено сколько угодно приложений.

Обмен любой информацией между приложениями осуществлять только через redis. 

Все запущенные копии приложения кроме генератора, являются обработчиками сообщений и в любой момент готовы получить сообщение из redis.

Все сообщения должны быть обработаны, причём только один раз, только одним из обработчиков.

Генератором должно быть только одно из запущенных приложений. Т.е. каждое приложение может стать генератором. Но в любой момент времени может работать только один генератор.

Если текущий генератор завершить принудительно (обработчик завершения запрещен, например, выключили из розетки), то одно из приложений должно заменить завершённое (упавшее) и стать генератором. Для определения кто генератор нельзя использовать средства ОС, считается что все приложения запущенны на разных серверах и общаются только через redis.

Сообщения генерируются раз в 500 мс.

Для генерации сообщения использовать любую функцию с рандомным текстовым ответом.

Приложение, получая сообщение, с вероятностью 5% определяет, что сообщение содержит ошибку.

Если сообщение содержит ошибку, то сообщение следует поместить в redis для дальнейшего изучения.

Если приложение запустить с параметром 'getErrors', то оно заберет из redis все сообщения с ошибкой, выведет их на экран и завершится, при этом из базы сообщения удаляются.

Проверить что приложение может обработать 1000000 сообщений (интервал 500мс можно убрать для теста)

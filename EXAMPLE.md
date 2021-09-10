
### An Example
A group consisting of Alice, Bob and Charlie:

Bob spends 30$ for a meal shared with Alice, he submits `[15, 15, 0]` which indicates he and Alice split the cost evenly.

Charlie spends 15$ for ice creams for everyone, he submits `[5, 5, 5]`.

Assuming everyone had 40$, the accounts are like this:
|            | token | owed | debt |
|------------|-------|------|------|
| Alice      | 40    | 0    | 20   |
| Bob        | 10    | 30   | 20   |
| Charlie    | 25    | 15   | 5    |
| Splitmatic | 0     |      |      |

Now, Alice settles:
|            | token | owed | debt |
|------------|-------|------|------|
| Alice      | 20    | 0    | 0    |
| Bob        | 10    | 30   | 20   |
| Charlie    | 25    | 15   | 5    |
| Splitmatic | 20    |      |      |

Bob settles:
|            | token | owed | debt |
|------------|-------|------|------|
| Alice      | 20    | 0    | 0    |
| Bob        | 20    | 0    | 0    |
| Charlie    | 25    | 15   | 5    |
| Splitmatic | 10    |      |      |

Charlie settles:
|            | token | owed | debt |
|------------|-------|------|------|
| Alice      | 20    | 0    | 0    |
| Bob        | 20    | 0    | 0    |
| Charlie    | 35    | 0    | 0    |
| Splitmatic | 0     |      |      |
### snapshot

Snapshot a single course.

Get command arguments:

```
./src/command/snapshot.ts --help
```

Basic invocation (URL to any course page/tab should work):

```
./src/command/snapshot.ts https://groton.myschoolapp.com/app/faculty#academicclass/97551579/0/bulletinboard
```

Pass username and password from 1Password using op cli tool (`$OP_ITEM` environment variable is the item identifier in 1Password of the desired login):

```
./src/commands/snapshot.ts -u "$(op item get $OP_ITEM --fields username)" -p "$(op item get $OP_ITEM --fields password --reveal)" --sso "entra-id" https://groton.myschoolapp.com/app/faculty#academicclass/97551579/0/bulletinboard
```

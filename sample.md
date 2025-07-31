# Toggle Tables Plugin Demo

This file demonstrates the functionality of the Toggle Tables plugin.

## Small Table (Not Toggleable)

This table has fewer than 10 rows, so it won't be made toggleable:

| Name | Age | City |
|------|-----|------|
| Alice | 25 | New York |
| Bob | 30 | Los Angeles |
| Carol | 28 | Chicago |

## Large Table (Automatically Toggleable)

This table has more than 10 rows, so it will automatically become toggleable:

| Port | Protocol | Service | Description |
|------|----------|---------|-------------|
| 20/21 | TCP | FTP | File Transfer Protocol - for file uploads/downloads |
| 22 | TCP | SSH | Secure Shell - encrypted remote administration |
| 23 | TCP | Telnet | Unencrypted remote terminal access (insecure) |
| 25 | TCP | SMTP | Simple Mail Transfer Protocol - email sending |
| 53 | TCP/UDP | DNS | Domain Name System - hostname resolution |
| 80 | TCP | HTTP | Hypertext Transfer Protocol - web browsing |
| 110 | TCP | POP3 | Post Office Protocol - email retrieval |
| 123 | UDP | NTP | Network Time Protocol - time synchronization |
| 143 | TCP | IMAP | Internet Message Access Protocol - email management |
| 443 | TCP | HTTPS | HTTP Secure - encrypted web browsing |
| 993 | TCP | IMAPS | Secure IMAP - encrypted email management |
| 995 | TCP | POP3S | Secure POP3 - encrypted email retrieval |
| 1433 | TCP | MSSQL | Microsoft SQL Server database |
| 1521 | TCP | Oracle | Oracle database |
| 3306 | TCP | MySQL | MySQL database |
| 5432 | TCP | PostgreSQL | PostgreSQL database |
| 6379 | TCP | Redis | Redis in-memory database |
| 8080 | TCP | HTTP Alt | Alternative HTTP port |
| 8443 | TCP | HTTPS Alt | Alternative HTTPS port |
| 27017 | TCP | MongoDB | MongoDB database |

## Another Large Table

| Programming Language | Year Created | Creator | Primary Use |
|---------------------|--------------|---------|-------------|
| Fortran | 1957 | IBM | Scientific computing |
| Lisp | 1958 | John McCarthy | AI and symbolic computation |
| COBOL | 1959 | Grace Hopper | Business applications |
| BASIC | 1964 | John Kemeny, Thomas Kurtz | Education |
| Pascal | 1970 | Niklaus Wirth | Education and systems programming |
| C | 1972 | Dennis Ritchie | Systems programming |
| Smalltalk | 1972 | Alan Kay | Object-oriented programming |
| Prolog | 1972 | Alain Colmerauer | Logic programming |
| ML | 1973 | Robin Milner | Functional programming |
| Scheme | 1975 | Gerald Jay Sussman, Guy Steele | Education and research |
| Ada | 1980 | Jean Ichbiah | Military and safety-critical systems |
| C++ | 1983 | Bjarne Stroustrup | Systems programming, applications |
| Objective-C | 1984 | Brad Cox, Tom Love | Apple ecosystem |
| Eiffel | 1985 | Bertrand Meyer | Software engineering |
| Perl | 1987 | Larry Wall | Text processing, system administration |
| Tcl | 1988 | John Ousterhout | Scripting, GUI |
| Python | 1991 | Guido van Rossum | General-purpose programming |
| Visual Basic | 1991 | Microsoft | Windows applications |
| Ruby | 1995 | Yukihiro Matsumoto | Web development, scripting |
| Java | 1995 | James Gosling | Enterprise applications |
| JavaScript | 1995 | Brendan Eich | Web development |
| PHP | 1995 | Rasmus Lerdorf | Web development |
| Delphi | 1995 | Borland | Windows applications |
| C# | 2000 | Microsoft | Windows applications, .NET |
| Scala | 2003 | Martin Odersky | Functional programming, JVM |
| Groovy | 2003 | James Strachan | JVM scripting |
| Go | 2009 | Google | Systems programming, cloud services |
| Rust | 2010 | Mozilla | Systems programming, safety |
| Kotlin | 2011 | JetBrains | Android development, JVM |
| Swift | 2014 | Apple | iOS/macOS development |
| TypeScript | 2012 | Microsoft | Web development with types |

## Manual Toggle Example

You can also manually wrap tables in toggle markup:

<!-- toggle-table -->
| Framework | Language | Use Case |
|-----------|----------|----------|
| React | JavaScript | Frontend development |
| Angular | TypeScript | Enterprise applications |
| Vue | JavaScript | Progressive web apps |
| Svelte | JavaScript | Lightweight applications |
<!-- /toggle-table -->

## Notes

- Tables with more than 10 rows (configurable) are automatically made toggleable
- You can customize the appearance and behavior in the plugin settings
- Use the command palette to manually toggle tables or wrap them in toggles
- The plugin works with both light and dark themes 
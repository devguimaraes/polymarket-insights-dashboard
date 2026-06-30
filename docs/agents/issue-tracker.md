# Issue tracker: Linear

Issues e PRDs deste repo vivem no Linear. Use as ferramentas MCP do plugin Linear (`mcp__plugin_linear_linear__*`) para todas as operações.

## Pré-requisito: resolver o time

Antes de criar ou buscar issues, determine o time correto com `mcp__plugin_linear_linear__list_teams`. O nome ou ID do time é necessário em várias operações.

## Convenções

- **Criar uma issue**: `mcp__plugin_linear_linear__save_issue` — requer `title` e `team`. Use `description` para o corpo (Markdown). Opcionalmente defina `priority` (0=None, 1=Urgent, 2=High, 3=Medium, 4=Low), `labels`, `assignee`, `project`, `cycle`.
- **Ler uma issue**: `mcp__plugin_linear_linear__get_issue` com o ID ou identifier (ex.: `LIN-123`). Use `includeRelations: true` para ver blocking/related.
- **Listar issues**: `mcp__plugin_linear_linear__list_issues` com filtros: `team`, `state`, `labels`, `assignee`, `priority`, `project`, `cycle`, `query` (busca textual).
- **Comentar em uma issue**: `mcp__plugin_linear_linear__save_comment` com `issueId` e `body` (Markdown). Para responder a um thread existente, passe `parentId`.
- **Aplicar labels**: `mcp__plugin_linear_linear__save_issue` com array `labels` contendo os nomes das labels desejadas. **Nota:** isso substitui todas as labels existentes — para preservar labels anteriores, leia a issue primeiro e faça merge dos arrays.
- **Remover labels**: `mcp__plugin_linear_linear__save_issue` com array `labels` sem a label a ser removida.
- **Fechar/resolver**: `mcp__plugin_linear_linear__save_issue` com `state` = nome ou ID do estado desejado (ex.: `"Done"`, `"Cancelled"`). Use `mcp__plugin_linear_linear__list_issue_statuses` para descobrir os estados disponíveis no time.
- **Reabrir**: `mcp__plugin_linear_linear__save_issue` com `state` = nome do estado ativo (ex.: `"In Progress"`, `"Todo"`).

## Estados vs labels

No Linear, o fluxo de trabalho usa **estados** (state/status) para o ciclo de vida da issue e **labels** para categorização. As labels de triagem (ver `docs/agents/triage-labels.md`) são aplicadas como labels, não como estados. O estado padrão para uma issue recém-criada é o primeiro estado do workflow do time (tipicamente "Todo" ou "Backlog").

## Quando um skill diz "publique no issue tracker"

Crie uma issue no Linear com `save_issue`.

## Quando um skill diz "busque o ticket relevante"

Use `get_issue` com o identifier (ex.: `LIN-123`) passado pelo usuário ou encontrado via `list_issues`.

## Issues vs documentos

Linear tem tanto issues quanto documents. Issues são tarefas rastreáveis com estado e assignee. Documents são notas estruturadas com título e conteúdo. Skills de engenharia usam **issues** para trabalho rastreável. Se um skill pedir para criar um documento de planejamento, use `mcp__plugin_linear_linear__save_document`.

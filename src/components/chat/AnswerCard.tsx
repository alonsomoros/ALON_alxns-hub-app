import { ThumbsDown } from 'lucide-react'
import { formatCell, type ChatAnswer } from '../../domain/chat'

const isNumeric = (type: string) => type === 'money' || type === 'count'

/** Respuesta del asistente: la interpretación (chips) va siempre visible, porque un malentendido tiene que notarse. */
export function AnswerCard({ answer, feedback, onWrong }: { answer: ChatAnswer; feedback: 'none' | 'wrong'; onWrong: () => void }) {
  const data = answer.data
  return <article className="chat-bubble assistant">
    <header className="answer-head">
      <strong>{answer.interpretation.title}</strong>
      <span className="chat-badge">{answer.source === 'rules' ? 'al instante' : 'modelo'}</span>
      {answer.mock && <span className="chat-badge warn">datos de ejemplo</span>}
    </header>
    {answer.interpretation.chips.length > 0 && <ul className="chat-chips" aria-label="Cómo he entendido tu pregunta">
      {answer.interpretation.chips.map((chip) => <li key={chip}>{chip}</li>)}
    </ul>}
    <p className="answer-text">{answer.text}</p>
    {data.kind === 'table' && <div className="answer-table-wrap" role="region" aria-label="Tabla de resultados" tabIndex={0}>
      <table className="answer-table">
        <thead><tr>{data.columns.map((column) => <th className={isNumeric(column.type) ? 'num' : undefined} scope="col" key={column.key}>{column.label}</th>)}</tr></thead>
        <tbody>{data.rows.map((row, rowIndex) => <tr key={rowIndex}>
          {row.map((cell, index) => <td className={isNumeric(data.columns[index].type) ? 'num' : undefined} key={data.columns[index].key}>{formatCell(cell, data.columns[index].type)}</td>)}
        </tr>)}</tbody>
      </table>
    </div>}
    <div className="answer-actions">
      <button className="answer-action" type="button" disabled={feedback === 'wrong'} onClick={onWrong}><ThumbsDown size={13} aria-hidden="true" /> {feedback === 'wrong' ? 'Anotado' : 'No era eso'}</button>
    </div>
  </article>
}

"""Fixed, model-free RU/EN lexical retrieval. No exam gold is read here."""
import re, sqlite3

# Subject vocabulary fixed before reading the new exam or any generations.
ALIASES={
 'ликвид':['liquidation','liquidate'], 'залог':['collateral'],
 'здоров':['health','factor'], 'возврат':['repay','withdraw'],
 'погаш':['repay','repayment'], 'займ':['borrow','loan'],
 'заимств':['borrow'], 'долг':['debt'], 'кредит':['loan','borrow'],
 'резерв':['reserve'], 'процент':['interest','rate'],
 'ставк':['rate'], 'утилиз':['utilization'], 'использован':['utilization'],
 'вывод':['withdraw'], 'снят':['withdraw'], 'депозит':['deposit'],
 'внес':['supply','deposit'], 'внести':['supply','deposit'],
 'поставщик':['supplier'], 'доступн':['available'],
 'порог':['threshold'], 'максимальн':['maximum','max'],
 'комисс':['fee'], 'бонус':['bonus'], 'режим':['mode'],
 'изол':['isolation','isolated'], 'эффективност':['efficiency'],
 'мгновенн':['flash'], 'флэш':['flash'], 'флеш':['flash'],
 'атомарн':['atomic'], 'транзакц':['transaction'],
 'обеспеч':['collateral'], 'актив':['asset'], 'токен':['token'],
 'баланс':['balance'], 'дол':['share'], 'хранилищ':['vault'],
 'хранилище':['vault'], 'округл':['rounding','round'],
 'вниз':['down','floor'], 'вверх':['up','ceil'],
 'одобрен':['approve','approval'], 'разрешен':['allowance'],
 'перевод':['transfer'], 'перевест':['transfer'],
 'событи':['event'], 'ошиб':['revert','error'],
 'нулев':['zero'], 'неогранич':['unlimited'],
 'защит':['protection'], 'просроч':['expired','expiry'],
 'рефер':['referral'], 'термин':['term'], 'выплат':['repay'],
 'соотношен':['ratio'], 'неизмен':['constant'],
 'срок':['duration','term'], 'обязатель':['must'],
 'ограничен':['limit'], 'владельц':['owner'], 'получател':['receiver'],
 'недостаточ':['insufficient'], 'стоимост':['value'],
 'паден':['decrease'], 'цен':['price'], 'маржин':['margin']
}
STOP={'aave','kamino','ethereum','erc','eip','what','the','and','with','from','that','this','true','false','string','number','boolean'}

def query_terms(question):
    low=question.casefold();terms=[]
    for word in re.findall(r'[a-z][a-z0-9_]*|[0-9]{2,5}',low):
      if word not in STOP:terms.extend(word.split('_'))
    for stem,translated in ALIASES.items():
      if stem in low:terms.extend(translated)
    return list(dict.fromkeys(x for x in terms if x and x not in STOP))[:64]

def search(db_path,protocol,question,k=3):
    terms=query_terms(question)
    if not terms:return {'query_terms':[],'match_expression':'','hits':[]}
    match=' OR '.join('"'+x.replace('"','""')+'"' for x in terms)
    sql='''SELECT c.id,c.doc_id,c.part,c.start_char,c.end_char,c.body,d.title,d.url,d.version,d.retrieved_at_utc,bm25(chunks,0,0,0,0,0,3,1) AS score
      FROM chunks c JOIN docs d ON d.doc_id=c.doc_id
      WHERE chunks MATCH ? AND d.protocol=?'''
    values=[match,protocol]
    if protocol=='aave':sql+=" AND d.version='v3'"
    if protocol=='ethereum':sql+=" AND d.version IN ('Final','Living')"
    sql+=' ORDER BY score ASC,c.id ASC LIMIT ?';values.append(k)
    with sqlite3.connect(db_path) as db:
      db.row_factory=sqlite3.Row;rows=db.execute(sql,values).fetchall()
    return {'query_terms':terms,'match_expression':match,'hits':[dict(r) for r in rows]}

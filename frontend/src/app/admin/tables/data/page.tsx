'use client';

import { useEffect, useState } from 'react';
import { dbTableService, type TableColumn } from '@/services/dbTableService';
import { getTableMeta, type FkRelation } from '@/data/tableComments';

function isAutoColumn(col: TableColumn) {
  return col.is_identity === 'YES' ||
    !!(col.column_default && col.column_default.includes('nextval'));
}

function isPkColumn(col: TableColumn) {
  return col.column_name === 'id' || isAutoColumn(col);
}

export default function AdminDbDataPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState<TableColumn[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fkRelations, setFkRelations] = useState<FkRelation[]>([]);
  const [fkLookup, setFkLookup] = useState<Record<string, Record<string, string>>>({});

  const [showFilter, setShowFilter] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});

  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState<Record<string, string>>({});
  const [editingPk, setEditingPk] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  useEffect(() => {
    dbTableService.listTables().then(res => {
      if (res.data.success && res.data.data) setTables(res.data.data);
    });
  }, []);

  const filteredTables = tables.filter(t => {
    if (!search.trim()) return true;
    const lower = search.toLowerCase();
    const meta = getTableMeta(t);
    return t.toLowerCase().includes(lower) || (meta?.tableComment ?? '').toLowerCase().includes(lower);
  });

  const loadFkData = async (relations: FkRelation[]) => {
    if (!relations.length) return;
    const lookup: Record<string, Record<string, string>> = {};
    await Promise.all(
      relations.map(async rel => {
        try {
          const res = await dbTableService.getRows(rel.foreignTable, 0, 500);
          if (res.data.success && res.data.data) {
            lookup[rel.column] = {};
            for (const row of res.data.data.content) {
              const id = String(row[rel.foreignColumn] ?? '');
              const label = String(row[rel.displayColumn] ?? '');
              lookup[rel.column][id] = label;
            }
          }
        } catch { /* 참조 테이블 로드 실패 시 무시 */ }
      })
    );
    setFkLookup(lookup);
  };

  const loadTable = async (tableName: string, p: number, size: number) => {
    if (!tableName) return;
    setLoading(true);
    setError('');
    try {
      const [colRes, rowRes] = await Promise.all([
        dbTableService.getColumns(tableName),
        dbTableService.getRows(tableName, p, size),
      ]);
      if (colRes.data.success && colRes.data.data) setColumns(colRes.data.data);
      if (rowRes.data.success && rowRes.data.data) {
        setRows(rowRes.data.data.content);
        setTotal(rowRes.data.data.totalElements);
      }
    } catch {
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTable = (t: string) => {
    if (!t) return;
    setSelectedTable(t);
    setPage(0);
    setShowAdd(false);
    setEditingPk(null);
    setColumns([]);
    setRows([]);
    setFkLookup({});
    const rels = getTableMeta(t)?.fkRelations ?? [];
    setFkRelations(rels);
    setShowFilter(false);
    setFilterValues({});
    loadTable(t, 0, pageSize);
    loadFkData(rels);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    loadTable(selectedTable, newPage, pageSize);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
    loadTable(selectedTable, 0, newSize);
  };

  const handleAdd = async () => {
    const payload: Record<string, unknown> = {};
    columns.filter(c => !isAutoColumn(c)).forEach(c => {
      if (addForm[c.column_name] !== undefined && addForm[c.column_name] !== '') {
        payload[c.column_name] = addForm[c.column_name];
      }
    });
    try {
      await dbTableService.insertRow(selectedTable, payload);
      setShowAdd(false);
      setAddForm({});
      loadTable(selectedTable, page, pageSize);
    } catch {
      setError('행 추가에 실패했습니다.');
    }
  };

  const startEdit = (row: Record<string, unknown>) => {
    const pk = String(row['id'] ?? '');
    setEditingPk(pk);
    const form: Record<string, string> = {};
    columns.forEach(c => { form[c.column_name] = String(row[c.column_name] ?? ''); });
    setEditForm(form);
  };

  const handleUpdate = async () => {
    if (!editingPk) return;
    const payload: Record<string, unknown> = {};
    columns.forEach(c => {
      if (editForm[c.column_name] !== undefined) payload[c.column_name] = editForm[c.column_name];
    });
    try {
      await dbTableService.updateRow(selectedTable, editingPk, payload);
      setEditingPk(null);
      loadTable(selectedTable, page, pageSize);
    } catch {
      setError('행 수정에 실패했습니다.');
    }
  };

  const handleDelete = async (row: Record<string, unknown>) => {
    const pk = String(row['id'] ?? '');
    if (!confirm(`ID ${pk} 행을 삭제하시겠습니까?`)) return;
    try {
      await dbTableService.deleteRow(selectedTable, pk);
      loadTable(selectedTable, page, pageSize);
    } catch {
      setError('행 삭제에 실패했습니다.');
    }
  };

  const renderCellValue = (col: TableColumn, row: Record<string, unknown>) => {
    const rawVal = row[col.column_name];
    const fkRel = fkRelations.find(r => r.column === col.column_name);
    const cellStr = rawVal === null || rawVal === undefined ? null : String(rawVal);

    if (cellStr === null) {
      return <span className="text-gray-300 italic">null</span>;
    }

    if (fkRel && fkLookup[fkRel.column]) {
      const label = fkLookup[fkRel.column][cellStr];
      return (
        <span className="flex items-center gap-1 flex-wrap">
          <span>{cellStr}</span>
          {label && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-indigo-100 text-indigo-700 whitespace-nowrap">
              {label}
            </span>
          )}
        </span>
      );
    }

    return (
      <span className="block max-w-[200px] truncate" title={cellStr}>
        {cellStr}
      </span>
    );
  };

  const getFkRel = (colName: string) => fkRelations.find(r => r.column === colName);

  const tableMeta = getTableMeta(selectedTable);
  const totalPages = Math.ceil(total / pageSize);
  const filteredRows = rows.filter(row =>
    columns.every(col => {
      const fv = filterValues[col.column_name];
      if (!fv || !fv.trim()) return true;
      const cell = String(row[col.column_name] ?? '').toLowerCase();
      return cell.includes(fv.toLowerCase());
    })
  );
  const hasPk = columns.some(c => c.column_name === 'id');

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">DB 테이블 조회</h2>
        <p className="text-sm text-gray-500 mt-0.5">테이블을 선택해 데이터를 조회·추가·수정·삭제합니다.</p>
      </div>

      {/* 검색 + 테이블 선택 */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="테이블명 또는 설명 검색..."
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={selectedTable}
          onChange={e => handleSelectTable(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">— 테이블 선택 —</option>
          {filteredTables.map(t => {
            const meta = getTableMeta(t);
            return (
              <option key={t} value={t}>
                {t}{meta ? ` (${meta.tableComment})` : ''}
              </option>
            );
          })}
        </select>
        {selectedTable && (
          <>
            <button
              onClick={() => { setShowFilter(v => !v); setFilterValues({}); }}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 border border-gray-300 transition"
            >
              {showFilter ? '필터 닫기' : '데이터 상세 조회'}
            </button>
            <button
              onClick={() => { setShowAdd(v => !v); setAddForm({}); }}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              {showAdd ? '취소' : '+ 행 추가'}
            </button>
          </>
        )}
      </div>

      {/* 컬럼 필터 패널 */}
      {selectedTable && showFilter && columns.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">컬럼 필터</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {columns.map(col => {
              const comment = tableMeta?.columns[col.column_name];
              return (
                <div key={col.column_name}>
                  <label className="block text-xs text-gray-500 mb-1">
                    {col.column_name}
                    {comment && <span className="ml-1 text-indigo-400">({comment})</span>}
                  </label>
                  <input
                    type="text"
                    value={filterValues[col.column_name] ?? ''}
                    onChange={e => setFilterValues(f => ({ ...f, [col.column_name]: e.target.value }))}
                    placeholder="포함 문자열..."
                    className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              );
            })}
          </div>
          {Object.values(filterValues).some(v => v.trim()) && (
            <button
              onClick={() => setFilterValues({})}
              className="mt-3 px-3 py-1 text-xs text-gray-500 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            >
              필터 초기화
            </button>
          )}
        </div>
      )}

      {/* 참조(부모) 테이블 정보 */}
      {selectedTable && fkRelations.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">참조 테이블</p>
          <div className="flex flex-wrap gap-2">
            {fkRelations.map(rel => {
              const parentMeta = getTableMeta(rel.foreignTable);
              return (
                <button
                  key={rel.column}
                  onClick={() => handleSelectTable(rel.foreignTable)}
                  className="inline-flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 rounded-lg px-3 py-1.5 text-xs text-indigo-700 hover:bg-indigo-100 transition"
                >
                  <span className="font-mono bg-indigo-200 rounded px-1">{rel.column}</span>
                  <span className="text-indigo-400">→</span>
                  <span className="font-semibold">{rel.foreignTable}</span>
                  {parentMeta && <span className="text-indigo-500">({parentMeta.tableComment})</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2">{error}</p>}

      {/* 추가 폼 */}
      {showAdd && columns.length > 0 && (
        <div className="bg-white border border-indigo-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3">새 행 추가</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {columns.map(col => {
              const comment = tableMeta?.columns[col.column_name];
              const auto = isAutoColumn(col);
              const fkRel = getFkRel(col.column_name);
              const fkOptions = fkRel ? fkLookup[fkRel.column] : undefined;
              return (
                <div key={col.column_name}>
                  <label className="block text-xs mb-1 flex items-center gap-1 flex-wrap">
                    <span className={auto ? 'text-gray-400' : 'text-gray-500'}>{col.column_name}</span>
                    <span className="text-gray-300">({col.data_type})</span>
                    {auto && <span className="text-[10px] bg-gray-100 text-gray-400 rounded px-1">자동</span>}
                    {!auto && col.is_nullable === 'NO' && <span className="text-red-400">*</span>}
                    {comment && <span className="text-indigo-400">— {comment}</span>}
                  </label>
                  {auto ? (
                    <input
                      disabled
                      placeholder="(자동 생성)"
                      className="w-full border border-gray-200 bg-gray-50 text-gray-400 rounded-lg px-2.5 py-1.5 text-sm cursor-not-allowed"
                    />
                  ) : fkOptions ? (
                    <select
                      value={addForm[col.column_name] ?? ''}
                      onChange={e => setAddForm(f => ({ ...f, [col.column_name]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    >
                      <option value="">— 선택 —</option>
                      {Object.entries(fkOptions).map(([id, label]) => (
                        <option key={id} value={id}>{id} — {label}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={addForm[col.column_name] ?? ''}
                      onChange={e => setAddForm(f => ({ ...f, [col.column_name]: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <button onClick={() => setShowAdd(false)}
              className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition">
              취소
            </button>
            <button onClick={handleAdd}
              className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
              저장
            </button>
          </div>
        </div>
      )}

      {/* 총 건수 + 페이지 크기 선택 */}
      {selectedTable && !loading && total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">
            총 <span className="font-semibold text-gray-700">{total}</span>건
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-400">행 표시:</span>
            {[10, 20, 50].map(s => (
              <button
                key={s}
                onClick={() => handlePageSizeChange(s)}
                className={[
                  'px-2.5 py-1 text-xs rounded border transition',
                  s === pageSize
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50',
                ].join(' ')}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 테이블 */}
      {selectedTable && (
        loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : columns.length > 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto">
            <table className="w-full text-xs min-w-max">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {columns.map(col => {
                    const comment = tableMeta?.columns[col.column_name];
                    return (
                      <th
                        key={col.column_name}
                        className="px-3 py-2.5 text-left font-medium text-gray-600 whitespace-nowrap"
                      >
                        <div className="flex flex-col gap-0.5">
                          <span>
                            {col.column_name}
                            <span className="ml-1 font-normal text-gray-400">({col.data_type})</span>
                          </span>
                          {comment && (
                            <span className="text-[10px] font-normal text-indigo-500">{comment}</span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  {hasPk && (
                    <th className="px-3 py-2.5 text-center font-medium text-gray-600 whitespace-nowrap w-24">
                      관리
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRows.length === 0 && (
                  <tr>
                    <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">
                      {Object.values(filterValues).some(v => v.trim()) ? '필터 조건에 맞는 데이터가 없습니다.' : '데이터가 없습니다.'}
                    </td>
                  </tr>
                )}
                {filteredRows.map((row, rowIdx) => {
                  const pk = String(row['id'] ?? rowIdx);
                  const isEditing = editingPk === pk;
                  return (
                    <tr key={pk} className="hover:bg-gray-50">
                      {columns.map(col => (
                        <td key={col.column_name} className="px-3 py-2 text-gray-700">
                          {isEditing ? (() => {
                            if (isPkColumn(col)) {
                              return (
                                <input
                                  disabled
                                  value={editForm[col.column_name] ?? ''}
                                  className="w-full min-w-[60px] border border-gray-200 bg-gray-50 text-gray-400 rounded px-2 py-1 text-xs cursor-not-allowed"
                                />
                              );
                            }
                            const fkRel = getFkRel(col.column_name);
                            const fkOptions = fkRel ? fkLookup[fkRel.column] : undefined;
                            return fkOptions ? (
                              <select
                                value={editForm[col.column_name] ?? ''}
                                onChange={e => setEditForm(f => ({ ...f, [col.column_name]: e.target.value }))}
                                className="w-full min-w-[100px] border border-indigo-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 bg-white"
                              >
                                <option value="">— 선택 —</option>
                                {Object.entries(fkOptions).map(([id, label]) => (
                                  <option key={id} value={id}>{id} — {label}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                value={editForm[col.column_name] ?? ''}
                                onChange={e => setEditForm(f => ({ ...f, [col.column_name]: e.target.value }))}
                                className="w-full min-w-[80px] border border-indigo-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              />
                            );
                          })() : renderCellValue(col, row)}
                        </td>
                      ))}
                      {hasPk && (
                        <td className="px-3 py-2 text-center whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex gap-1 justify-center">
                              <button onClick={handleUpdate}
                                className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition">
                                저장
                              </button>
                              <button onClick={() => setEditingPk(null)}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition">
                                취소
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-center">
                              <button onClick={() => startEdit(row)}
                                className="px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition">
                                수정
                              </button>
                              <button onClick={() => handleDelete(row)}
                                className="px-2 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition">
                                삭제
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : null
      )}

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-1">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page === 0}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            이전
          </button>
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
            <button
              key={i}
              onClick={() => handlePageChange(i)}
              className={[
                'px-3 py-1.5 text-sm border rounded-lg',
                i === page ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:bg-gray-50',
              ].join(' ')}
            >
              {i + 1}
            </button>
          ))}
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

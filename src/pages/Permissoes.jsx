import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Shield, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Permissoes() {
    const [cargos, setCargos] = useState([]);
    const [todasPermissoes, setTodasPermissoes] = useState([]);
    const [loadingCargos, setLoadingCargos] = useState(true);
    const [loadingPerms, setLoadingPerms] = useState(true);

    const [cargoSelecionado, setCargoSelecionado] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [cargoParaEditar, setCargoParaEditar] = useState({ id: null, nome: '' });

    const fetchCargos = async () => {
        try {
            const res = await api.get('/permissoes/cargos');
            setCargos(res.data);
        } catch (error) {
            toast.error("Erro ao carregar cargos");
        } finally {
            setLoadingCargos(false);
        }
    };

    const fetchPermissoes = async () => {
        try {
            const res = await api.get('/permissoes/');
            setTodasPermissoes(res.data);
        } catch (error) {
            toast.error("Erro ao carregar permissões");
        } finally {
            setLoadingPerms(false);
        }
    };

    useEffect(() => {
        fetchCargos();
        fetchPermissoes();
    }, []);

    useEffect(() => {
        if (cargos.length > 0) {
            if (cargoSelecionado) {
                const updatedCargo = cargos.find(c => c.id === cargoSelecionado.id);
                if (updatedCargo) setCargoSelecionado(updatedCargo);
                else setCargoSelecionado(cargos[0]);
            } else {
                setCargoSelecionado(cargos[0]);
            }
        } else {
             setCargoSelecionado(null);
        }
    }, [cargos]);

    const modulos = todasPermissoes.reduce((acc, perm) => {
        if (!acc[perm.modulo]) acc[perm.modulo] = [];
        acc[perm.modulo].push(perm);
        return acc;
    }, {});

    async function handleToggle(cargoId, permId, temPermissao) {
        try {
            // Get current permissions array
            let currentPerms = [...(cargoSelecionado.permissoes || [])];
            if (temPermissao) {
                currentPerms = currentPerms.filter(p => p !== permId);
            } else {
                currentPerms.push(permId);
            }

            await api.put(`/permissoes/cargos/${cargoId}/permissoes`, { permissoes: currentPerms });
            fetchCargos();
        } catch (error) {
            toast.error("Erro ao salvar permissão.");
        }
    }

    async function handleAddCargo() {
        const nome = prompt("Nome do Novo Cargo:");
        if (!nome) return;
        try {
            await api.post('/permissoes/cargos', { nome });
            toast.success(`Cargo '${nome}' criado!`);
            fetchCargos();
        } catch (error) {
            toast.error("Erro ao criar cargo");
        }
    }

    async function confirmEditCargo() {
        if (!cargoParaEditar.nome || cargoParaEditar.nome.trim() === '') return;
        try {
            await api.put(`/permissoes/cargos/${cargoParaEditar.id}`, { nome: cargoParaEditar.nome.trim() });
            toast.success("Cargo atualizado!");
            setIsEditModalOpen(false);
            fetchCargos();
        } catch (error) {
            toast.error("Erro ao editar cargo.");
        }
    }

    function openEditModal(cargoId, nomeAtual) {
        setCargoParaEditar({ id: cargoId, nome: nomeAtual });
        setIsEditModalOpen(true);
    }

    async function handleDeleteCargo(cargoId) {
        if (!window.confirm("Tem certeza que deseja excluir este cargo?")) return;
        try {
            await api.delete(`/permissoes/cargos/${cargoId}`);
            toast.success("Cargo excluído!");
            fetchCargos();
        } catch (error) {
            toast.error("Erro ao excluir cargo.");
        }
    }

    if (loadingCargos || loadingPerms) return <div style={{padding:30, color:'var(--text-color, #333)'}}>Carregando...</div>;

    const isAdmin = cargoSelecionado?.nome?.toLowerCase() === 'admin' || cargoSelecionado?.nome?.toLowerCase() === 'manutenção';

    const hasPermission = (permId) => {
        if (!cargoSelecionado || !cargoSelecionado.permissoes) return false;
        if (cargoSelecionado.permissoes.some(p => p.id === permId)) return true;
        if (cargoSelecionado.permissoes.includes(permId)) return true;
        return false;
    };

    return (
        <div style={{padding: '20px', maxWidth: '1400px', margin: '0 auto'}}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px'}}>
                <h1 style={{margin: 0, fontSize: '1.5rem', fontWeight: 600}}>Gerenciamento de Permissões</h1>
                <div style={{display:'flex', gap:'10px'}}>
                    <button onClick={handleAddCargo} className="btn-add" style={{backgroundColor: '#8B5CF6', color: '#fff', height:'40px', padding:'0 15px', fontSize:'0.9rem', borderRadius: 8, display: 'flex', alignItems: 'center', border: 'none', cursor: 'pointer'}}>
                        <PlusCircle size={18} style={{marginRight:8}}/> Novo Cargo
                    </button>
                </div>
            </div>

            {/* SEÇÃO SUPERIOR: CARGOS */}
            <div style={{background: 'var(--card-bg, #fff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', padding: '20px', marginBottom: '20px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                <h3 style={{color: 'var(--text-muted, #64748b)', marginTop: 0, marginBottom: '15px', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8}}>
                    <Shield size={18}/> Selecione o Cargo
                </h3>
                <div style={{display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px'}} className="scrollbar-custom">
                    {cargos.map(c => {
                        const isSelected = cargoSelecionado?.id === c.id;
                        return (
                            <div key={c.id} style={{
                                display: 'flex', alignItems: 'center', gap: '8px',
                                background: isSelected ? '#8B5CF6' : 'var(--bg-subtle, #f1f5f9)',
                                color: isSelected ? 'white' : 'var(--text-color, #334155)',
                                borderRadius: '20px',
                                padding: '8px 16px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap',
                                fontWeight: isSelected ? 'bold' : 'normal',
                                border: isSelected ? '1px solid #a78bfa' : '1px solid transparent'
                            }} onClick={() => setCargoSelecionado(c)}>
                                <span style={{textTransform: 'capitalize'}}>{c.nome}</span>
                                {(c.nome.toLowerCase() !== 'admin' && c.nome.toLowerCase() !== 'manutenção') && (
                                    <div style={{display: 'flex', gap: '5px', marginLeft: '10px'}} onClick={e => e.stopPropagation()}>
                                        <button onClick={() => openEditModal(c.id, c.nome)} style={{background: 'none', border: 'none', color: isSelected ? '#fff' : '#64748b', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center'}}>
                                            <Pencil size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteCargo(c.id)} style={{background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center'}}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* SEÇÃO INFERIOR: PERMISSÕES */}
            <div style={{width: '100%'}}>
                {cargoSelecionado ? (
                    <div style={{background: 'var(--card-bg, #fff)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)', padding: '25px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)'}}>
                        <div style={{marginBottom: '25px', paddingBottom: '15px', borderBottom: '1px solid var(--border-color, #e2e8f0)'}}>
                            <h2 style={{margin: 0, color: 'var(--text-color, #1e293b)', textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 10}}>
                                Permissões: <span style={{color: '#8B5CF6'}}>{cargoSelecionado.nome}</span>
                                {isAdmin && <span style={{fontSize: '0.75rem', background: '#ef4444', padding: '4px 8px', borderRadius: 12, verticalAlign: 'middle', marginLeft: 10, color: 'white', fontWeight: 'bold'}}>Acesso Total</span>}
                            </h2>
                            <p style={{color: 'var(--text-muted, #64748b)', margin: '8px 0 0 0', fontSize: '0.9rem'}}>
                                {isAdmin ? 'O cargo de Administrador possui todas as permissões do sistema e não pode ser restrito.' : 'Ative ou desative as permissões específicas para este cargo.'}
                            </p>
                        </div>

                        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px'}}>
                            {Object.entries(modulos).map(([nomeModulo, permissoes]) => (
                                <div key={nomeModulo} style={{background: 'var(--bg-subtle, #f8fafc)', borderRadius: '10px', padding: '20px', border: '1px solid var(--border-color, #e2e8f0)'}}>
                                    <h3 style={{margin: '0 0 15px 0', color: '#8B5CF6', textTransform: 'uppercase', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 10, borderBottom: '1px solid var(--border-color, #e2e8f0)'}}>
                                        📂 {nomeModulo}
                                    </h3>
                                    
                                    <div style={{display: 'flex', flexDirection: 'column', gap: '12px'}}>
                                        {permissoes.map(perm => {
                                            const temPermissao = hasPermission(perm.id);
                                            const checked = temPermissao || isAdmin;

                                            return (
                                                <div key={perm.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', opacity: isAdmin ? 0.7 : 1}}>
                                                    <div>
                                                        <div style={{color: 'var(--text-color, #334155)', fontWeight: '500', fontSize: '0.9rem'}}>{perm.nome}</div>
                                                        <div style={{color: 'var(--text-muted, #64748b)', fontSize: '0.75rem'}}>{perm.slug}</div>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => !isAdmin && handleToggle(cargoSelecionado.id, perm.id, temPermissao)}
                                                        disabled={isAdmin}
                                                        style={{
                                                            background: checked ? '#10b981' : '#cbd5e1',
                                                            border: 'none',
                                                            borderRadius: '20px',
                                                            width: '46px',
                                                            height: '24px',
                                                            position: 'relative',
                                                            cursor: isAdmin ? 'not-allowed' : 'pointer',
                                                            transition: 'background 0.3s',
                                                            flexShrink: 0
                                                        }}
                                                    >
                                                        <div style={{
                                                            position: 'absolute',
                                                            top: '2px',
                                                            left: checked ? '24px' : '2px',
                                                            width: '20px',
                                                            height: '20px',
                                                            background: 'white',
                                                            borderRadius: '50%',
                                                            transition: 'left 0.3s'
                                                        }}/>
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: '300px', background: 'var(--card-bg, #fff)', borderRadius: '12px', border: '1px dashed var(--border-color, #cbd5e1)', color: 'var(--text-muted, #64748b)'}}>
                        Selecione um cargo na barra superior para visualizar suas permissões.
                    </div>
                )}
            </div>

            {/* MODAL DE EDIÇÃO DE CARGO */}
            {isEditModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)', backdropFilter: 'blur(4px)',
                    display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
                }}>
                    <div style={{
                        background: 'var(--card-bg, #fff)', border: '1px solid var(--border-color, #e2e8f0)', borderRadius: '12px',
                        padding: '25px', width: '90%', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
                    }}>
                        <h3 style={{color: 'var(--text-color, #1e293b)', marginTop: 0, display: 'flex', alignItems: 'center', gap: 10}}>
                            <Pencil size={20} color="#8B5CF6"/> Editar Nome do Cargo
                        </h3>
                        <p style={{color: 'var(--text-muted, #64748b)', fontSize: '0.85rem', marginBottom: '20px'}}>
                            Atenção: A alteração se aplicará a todos os usuários atuais.
                        </p>
                        
                        <input 
                            type="text" 
                            value={cargoParaEditar.nome}
                            onChange={(e) => setCargoParaEditar({...cargoParaEditar, nome: e.target.value})}
                            style={{
                                width: '100%', padding: '10px 15px', borderRadius: '8px',
                                border: '1px solid var(--border-color, #cbd5e1)', background: 'var(--bg-subtle, #f8fafc)', color: 'var(--text-color, #334155)',
                                marginBottom: '25px', fontSize: '1rem', boxSizing: 'border-box'
                            }}
                            autoFocus
                        />
                        
                        <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px'}}>
                            <button onClick={() => setIsEditModalOpen(false)} style={{
                                padding: '10px 15px', borderRadius: '8px', border: 'none',
                                background: '#e2e8f0', color: '#475569', cursor: 'pointer', fontWeight: 'bold'
                            }}>
                                Cancelar
                            </button>
                            <button onClick={confirmEditCargo} style={{
                                padding: '10px 15px', borderRadius: '8px', border: 'none',
                                background: '#8B5CF6', color: 'white', cursor: 'pointer', fontWeight: 'bold'
                            }}>
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

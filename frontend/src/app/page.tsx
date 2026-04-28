"use client"
import { useState } from "react";
import useRegister from "@/modules/register/service"
import useAuth from "@/modules/auth/service";
import { Entity } from "@/core/types";
import useEntity from "@/modules/entities/service";
import {Roles} from "@/core/types"


export default function Home() {
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [role, setRole] = useState<Roles>(Roles.USER);
  const [entity, setEntity] = useState<Entity>({id:0, meta: "", name: "", description: "", entity_type: ""});
  const {create, find, drop, with_type} = useEntity();
  const [type, setType] = useState<string>("");
  const [loading, register] = useRegister();
  const [authLoading, auth] = useAuth();

  const clickHandler = async() => {
    const data = await register({password, username, role});
    if (data.status === "success"){
      console.log(data.data);
    }
    else{
      console.log(data.error)
    }
  }

  const clickHandler1 = async() => {
    const data = await auth({password, username});
    if (data.status === "success"){
      console.log(data.data);
    }
    else{
      console.log(data.error)
    }
  }

 const clickHandler2 = async() => {
  const res = await create(entity);
  if (res.status == "success"){
    console.log(res)
  }
  else{
    console.log(res.error)
  }
  
 }

 const clickHandler3 = async() => {
  console.log(entity.id, typeof entity.id)
    if (!entity.id) return
    const e = find(entity.id);
    console.log(await e);
 }

 const clickHandler4 = async() => {
  const res = await with_type(type);
  if (res.status === "success"){
    console.log(res.data);
  }
  else{
    console.log(res.error)
  }
 }

 const clickHandler5 = async() => {
  if (entity.id === undefined) return
  const res = await drop(entity.id);
  console.log(res);
  if (res.status == "success"){
    console.log(`DATA: ${JSON.stringify(res.data)}`);
  }
  else{
    console.log(`ERROR: ${res.error}`);
  }
 }

  return (
    <>
    <h1>Register</h1>
    <div>
      <input onChange={e => {setPassword(e.target.value)}} value={password} placeholder="pass" />
      <input onChange={e => {setUsername(e.target.value)}} value={username} placeholder="username" />
      <input onChange={e => {setRole(e.target.value)}} value={role} placeholder="role" />
      <h2>{loading ? "LOADING" : ""}</h2>
      <button onClick={clickHandler}>SEND</button>
    </div>

    <h1>Auth</h1>
    <div>
      <input onChange={e => {setPassword(e.target.value)}} value={password} placeholder="pass" />
      <input onChange={e => {setUsername(e.target.value)}} value={username} placeholder="username" />
      <h2>{authLoading ? "LOADING" : ""}</h2>
      <button onClick={clickHandler1}>SEND</button>
    </div>

    <h1>Entity</h1>
    <div>
      <input onChange={e => {setEntity(ent => {return {...ent, entity_type: e.target.value}})}} value={entity.entity_type} placeholder="entity_type" />
      <input onChange={e => {setEntity(ent => {return {...ent, name: e.target.value}})}} value={entity.name} placeholder="name" />
      <input onChange={e => {setEntity(ent => {return {...ent, description: e.target.value}})}} value={entity.description} placeholder="desc" />
      <input onChange={e => {setEntity(ent => {return {...ent, meta: e.target.value}})}} value={entity.meta} placeholder="meta" />
      <button onClick={clickHandler2}>CREATE</button>
      <br />
      <input onChange={e => {setEntity(ent => {return {...ent, id: Number(e.target.value)}})}} value={entity.id} placeholder="id" />
      <button onClick={clickHandler3}>FIND</button>
      <br />
      <input onChange={e => setType(e.target.value)} placeholder="type" />
      <button onClick={clickHandler4}>GET TYPE</button>
      <br />
      <input onChange={e => {setEntity(ent => {return {...ent, id: Number(e.target.value)}})}} value={entity.id} placeholder="id" />
      <button onClick={clickHandler5}>DROP</button>
    </div>
    </>
  )
}

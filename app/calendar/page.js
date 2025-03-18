'use client'
import React, { useState } from "react";
import CustomButton from "@/components/(button)/button";
import Noti from "@/components/noti";

export default function Home() {
  const [count, setCount] = useState(false);
  return (
    <>
      <CustomButton onClick={() => setCount(true)} >Hãy bấm vào 1</CustomButton>
      <Noti open={count} onClose={() => setCount(false)} status={false} mes='bi' />
    </>
  )
}

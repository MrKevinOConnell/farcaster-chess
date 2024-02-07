import { Modal, Button } from "@mantine/core";
import { NeynarAPIClient } from "@neynar/nodejs-sdk";
import { useStore } from "@/store";
import { useEffect, useState } from "react";
import { checkUserAndLichessAccount } from "@/utils/prismaCalls";
import QRCode from "react-qr-code";

// make sure to set your NEYNAR_API_KEY .env
// don't have an API key yet? get one at neynar.com
const client = new NeynarAPIClient(
  process.env.NEXT_PUBLIC_NEYNAR_API_KEY as string
);

const SignerModal = () => {
  const openModal = useStore((state) => state.openChallengeModal);
  const setModal = useStore((state) => state.setChallengeModal);
  const qrCode = useStore((state) => state.qrCode);
  const openSignerModal = useStore((state) => state.openSignerModal);
  const setOpenSignerModal = useStore((state) => state.setOpenSignerModal);

  return (
    <Modal
      opened={openSignerModal}
      className="absolute top-1/3"
      onClose={async () => await setOpenSignerModal(false)}
      title="Add a signer to interact in chat!"
    >
      <div className="w-full h-full flex items-center justify-center flex-1">
        <QRCode value={""} size={256} />
      </div>
    </Modal>
  );
};

export default SignerModal;

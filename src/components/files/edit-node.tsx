import { NodeType } from "../../../database.types";

interface EditNodeProps {
  isOpen: boolean;
  onClose: () => void;
  onNodeEdited: (path: string, user_id: string, updateAll?: boolean) => void;
  node: NodeType;
}

const EditNode = ({ isOpen, onClose, onNodeEdited, node }: EditNodeProps) => {
  return <div>hello</div>;
};

export { EditNode };
